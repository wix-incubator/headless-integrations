import type { ClientDirective } from "astro";

function createPromiseHandle<T>() : {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
} {
  let resolve: (value: T) => void;
  let reject: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve: resolve!, reject: reject! };
}

type Task = {
  load: () => Promise<(props?: any) => Promise<void>>;
  el: Element;
  promiseHandle: ReturnType<typeof createPromiseHandle<void>>;
}

const pendingTasks: Set<Task> = new Set();

export default <ClientDirective>(async (load, _, el) => {
  const task: Task = {
    load,
    el,
    promiseHandle: createPromiseHandle<void>(),
  };
  pendingTasks.add(task);

  await processPendingTasks();

  return task.promiseHandle.promise;
});

async function processPendingTasks() {
  console.log("ClientDirective - processing pending tasks", pendingTasks.size);
  const tasks = Array.from(pendingTasks);
  for (const task of tasks) {
    await processTask(task);
  }
}

async function processTask(task: Task) {
  const service = getServiceFromElement(task.el);
  if (!service) {
    console.log("ClientDirective - Service not found on closest service provider");
    return;
  }
  console.log("ClientDirective - assigning service to element", service);
  assignServiceToElement(task.el, service);
  const [hydrate] = await Promise.all([task.load()]);
  await hydrate();
  task.promiseHandle.resolve();
  pendingTasks.delete(task);
}

function assignServiceToElement(el: Element, service: any) {
  const contextId = crypto.randomUUID();
  (globalThis as any).contexts = (globalThis as any).contexts || {};
  (globalThis as any).contexts[contextId] = service;
  setContextIdOnProps(el, contextId);
}


function getServiceFromElement(el: Element) {
  const ctxProvider = el.closest("context-provider");
  if (!ctxProvider) {
    return null;
  }
  const service = (ctxProvider as any).service;
  if (!service) {
    return null;
  }
  return service;
}

function setContextIdOnProps(el: Element, contextId: string) {
  const props = JSON.parse(el.getAttribute("props") || "{}");


  props["contextId"] = [0, contextId];
  el.setAttribute("props", JSON.stringify(props));
}

(globalThis as any).runDirectivePendingTaks = processPendingTasks;
