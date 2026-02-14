import { WORKER_CLIENTS, type WorkerClient } from "../data/mockClients";

export type WorkerClientsScenario = "default" | "empty" | "error";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getWorkerClients(scenario: WorkerClientsScenario): Promise<WorkerClient[]> {
  await wait(220);

  if (scenario === "error") {
    throw new Error("Failed to load clients");
  }

  if (scenario === "empty") {
    return [];
  }

  return WORKER_CLIENTS;
}
