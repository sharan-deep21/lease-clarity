"use client";

import React, { useState } from "react";
import { PromptInput, type Attachment } from "@/components/ui/ai-chat-input";

export default function Demo() {
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      text: string;
      model?: string;
      effort?: string;
      attachments?: Attachment[];
    }>
  >([]);

  const handleSubmit = (
    value: string,
    meta?: { model: string; effort: string; attachments: Attachment[] }
  ) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        text: value,
        model: meta?.model,
        effort: meta?.effort,
        attachments: meta?.attachments,
      },
    ]);
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-between p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight text-center">
          AI Chat Input Demo
        </h1>
        <p className="text-sm text-center text-muted-foreground">
          Features dynamic spring width physics, model switcher, reasoning effort, Web Audio API visualizer, and attachment gallery.
        </p>

        <div className="space-y-3 mt-8">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                <span className="font-semibold text-primary">{msg.model || "Default Model"}</span>
                <span>•</span>
                <span>Effort: {msg.effort || "medium"}</span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {msg.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 rounded-lg border border-border/80 bg-accent/40 px-2 py-1 text-xs"
                    >
                      <span>📎</span>
                      <span className="font-mono">{att.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-6 w-full max-w-2xl mt-8">
        <PromptInput
          placeholder="Ask anything, attach lease documents or voice prompt..."
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
