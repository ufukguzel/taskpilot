import { useEffect, useRef, useState } from "react";
import type { LiveRun, WsEvent } from "../types";

interface Options {
  onFinished?: () => void;
}

/**
 * Maintains a persistent WebSocket to /api/ws and exposes the current live run
 * plus a connection flag. Auto-reconnects with a short backoff.
 */
export function useLiveRuns({ onFinished }: Options = {}) {
  const [liveRun, setLiveRun] = useState<LiveRun | null>(null);
  const [connected, setConnected] = useState(false);
  const finishedRef = useRef(onFinished);
  finishedRef.current = onFinished;

  useEffect(() => {
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let closed = false;

    const connect = () => {
      const proto = location.protocol === "https:" ? "wss" : "ws";
      ws = new WebSocket(`${proto}://${location.host}/api/ws`);

      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 1500);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data) as WsEvent;
        if (msg.event === "run_started") {
          setLiveRun({
            runId: msg.run_id,
            taskId: msg.task_id,
            taskName: msg.task_name,
            trigger: msg.trigger,
            status: "running",
            lines: [],
          });
        } else if (msg.event === "log") {
          setLiveRun((prev) =>
            prev && prev.runId === msg.run_id
              ? { ...prev, lines: [...prev.lines, msg.line] }
              : prev
          );
        } else if (msg.event === "run_finished") {
          setLiveRun((prev) =>
            prev && prev.runId === msg.run_id ? { ...prev, status: msg.status } : prev
          );
          finishedRef.current?.();
        }
      };
    };

    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return { liveRun, connected, dismiss: () => setLiveRun(null) };
}
