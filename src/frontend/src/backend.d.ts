import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface http_header {
    value: string;
    name: string;
}
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface ProjectInput {
    topic: string;
    goal: ProjectGoal;
    voiceoverType: VoiceoverType;
    audience: ProjectAudience;
    platform: ProjectPlatform;
    style: ProjectStyle;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface Script {
    cta: string;
    value: string;
    patternInterrupt: string;
    hook: string;
    main: string;
}
export interface Project {
    id: bigint;
    status: ProjectStatus;
    topic: string;
    owner: Principal;
    scenes?: Array<Scene>;
    goal: ProjectGoal;
    customScript?: string;
    script?: Script;
    createdAt: bigint;
    voiceoverType: VoiceoverType;
    audience: ProjectAudience;
    platform: ProjectPlatform;
    style: ProjectStyle;
}
export interface Scene {
    title: string;
    duration: bigint;
    voiceoverLine: string;
    visualDescription: string;
    index: bigint;
}
export interface UserProfile {
    name: string;
}
export enum ProjectAudience {
    professionals = "professionals",
    students = "students",
    beginners = "beginners"
}
export enum ProjectGoal {
    educate = "educate",
    explain = "explain",
    sell = "sell",
    inspire = "inspire"
}
export enum ProjectPlatform {
    tiktok = "tiktok",
    youtube = "youtube"
}
export enum ProjectStatus {
    scenes_ready = "scenes_ready",
    scripted = "scripted",
    complete = "complete",
    rendering = "rendering",
    draft = "draft"
}
export enum ProjectStyle {
    social = "social",
    minimal = "minimal",
    cinematic = "cinematic",
    threeD = "threeD"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum VoiceoverType {
    custom = "custom",
    auto = "auto"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createProject(input: ProjectInput): Promise<bigint>;
    deleteProject(id: bigint): Promise<void>;
    generateScenes(projectId: bigint): Promise<string>;
    generateScript(projectId: bigint): Promise<string>;
    getAllProjects(): Promise<Array<Project>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProject(id: bigint): Promise<Project>;
    getProjectCount(): Promise<bigint>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getUserProjects(): Promise<Array<Project>>;
    hasOpenAIKey(): Promise<boolean>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setOpenAIKey(key: string): Promise<void>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateCustomScript(projectId: bigint, customScript: string): Promise<void>;
    updateProjectScenes(projectId: bigint, scenes: Array<Scene>): Promise<void>;
    updateProjectScript(projectId: bigint, script: Script): Promise<void>;
    updateProjectStatus(projectId: bigint, status: ProjectStatus): Promise<void>;
}
