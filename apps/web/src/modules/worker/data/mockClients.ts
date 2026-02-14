export type WorkerClient = {
  id: string;
  fullName: string;
  planStatus: "on_track" | "attention";
  lastCheckInLabel: string;
};

export const WORKER_CLIENTS: WorkerClient[] = [
  {
    id: "c-001",
    fullName: "Ana Martin",
    planStatus: "on_track",
    lastCheckInLabel: "Hoy",
  },
  {
    id: "c-002",
    fullName: "Luis Perez",
    planStatus: "attention",
    lastCheckInLabel: "Hace 2 dias",
  },
  {
    id: "c-003",
    fullName: "Marta Gil",
    planStatus: "on_track",
    lastCheckInLabel: "Ayer",
  },
];
