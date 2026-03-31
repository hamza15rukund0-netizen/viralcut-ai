import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProjectInput, ProjectStatus, Scene, Script } from "../backend";
import { useActor } from "./useActor";

export function useGetUserProjects() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["userProjects"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserProjects();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProject(id: bigint | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["project", id?.toString()],
    queryFn: async () => {
      if (!actor || id === null) throw new Error("No project id");
      return actor.getProject(id);
    },
    enabled: !!actor && !isFetching && id !== null,
  });
}

export function useCreateProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ProjectInput) => {
      if (!actor) throw new Error("No actor");
      return actor.createProject(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

/**
 * Extract the assistant message content from a raw OpenAI chat completion response.
 * The response shape is:
 *   {"choices":[{"message":{"role":"assistant","content":"<value>"},"finish_reason":"stop"}]}
 * We parse it properly with JSON.parse so all escape sequences are handled correctly.
 */
function extractOpenAIContent(raw: string): string {
  // First check if this is an OpenAI error response
  if (raw.includes('"error"')) {
    let parsed: { error?: { message?: string } };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(`OpenAI error: ${raw}`);
    }
    throw new Error(parsed?.error?.message ?? "OpenAI returned an error");
  }

  let parsed: { choices?: Array<{ message?: { content?: string } }> };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse OpenAI response: ${raw.slice(0, 200)}`);
  }

  const content = parsed?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`No content in OpenAI response: ${raw.slice(0, 200)}`);
  }

  // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
  return content
    .replace(/^```(?:json)?\s*/, "")
    .replace(/\s*```$/, "")
    .trim();
}

export function useGenerateScript() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: bigint) => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.generateScript(projectId);
      const content = extractOpenAIContent(raw);
      return JSON.parse(content) as Script;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

export function useGenerateScenes() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: bigint) => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.generateScenes(projectId);
      const content = extractOpenAIContent(raw);
      return JSON.parse(content) as Scene[];
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

export function useUpdateProjectScript() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      script,
    }: { projectId: bigint; script: Script }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProjectScript(projectId, script);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

export function useUpdateProjectStatus() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      status,
    }: { projectId: bigint; status: ProjectStatus }) => {
      if (!actor) throw new Error("No actor");
      return actor.updateProjectStatus(projectId, status);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

export function useDeleteProject() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("No actor");
      return actor.deleteProject(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["userProjects"] }),
  });
}

export function useHasOpenAIKey() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["hasOpenAIKey"],
    queryFn: async () => {
      if (!actor) return false;
      return (actor as any).hasOpenAIKey();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetOpenAIKey() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (key: string) => {
      if (!actor) throw new Error("No actor");
      return (actor as any).setOpenAIKey(key);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hasOpenAIKey"] }),
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["isCallerAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}
