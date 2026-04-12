import { sseEvent } from "@/lib/ai/resumeow/utils";
import { OrchestratorEventWriter } from "@/lib/ai/resumeow/orchestrator/types";

export function createOrchestratorEventWriter(
  writer: WritableStreamDefaultWriter<Uint8Array>
): OrchestratorEventWriter {
  const encoder = new TextEncoder();

  return {
    async write(event, data) {
      await writer.write(encoder.encode(sseEvent(event, data)));
    },
  };
}

