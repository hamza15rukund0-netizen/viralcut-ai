import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Time "mo:core/Time";

import OutCall "http-outcalls/outcall";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Nat "mo:core/Nat";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── OpenAI key ────────────────────────────────────────────────────────────
  var openAIKey : Text = "";

  public shared ({ caller }) func setOpenAIKey(key : Text) : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only admins can set the API key");
    };
    openAIKey := key;
  };

  public query func hasOpenAIKey() : async Bool {
    openAIKey.size() > 0;
  };

  // ── User Profile ──────────────────────────────────────────────────────────
  public type UserProfile = { name : Text };
  let userProfiles = Map.empty<Principal, UserProfile>();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    userProfiles.add(caller, profile);
  };

  // ── Types ─────────────────────────────────────────────────────────────────
  type ProjectGoal = { #educate; #sell; #inspire; #explain };
  type ProjectAudience = { #beginners; #students; #professionals };
  type ProjectStyle = { #cinematic; #minimal; #threeD; #social };
  type ProjectPlatform = { #tiktok; #youtube };
  type VoiceoverType = { #auto; #custom };
  type ProjectStatus = { #draft; #scripted; #scenes_ready; #rendering; #complete };

  type Script = {
    hook : Text;
    main : Text;
    patternInterrupt : Text;
    value : Text;
    cta : Text;
  };

  type Scene = {
    index : Nat;
    title : Text;
    visualDescription : Text;
    voiceoverLine : Text;
    duration : Nat;
  };

  type Project = {
    id : Nat;
    owner : Principal;
    topic : Text;
    goal : ProjectGoal;
    audience : ProjectAudience;
    style : ProjectStyle;
    platform : ProjectPlatform;
    voiceoverType : VoiceoverType;
    customScript : ?Text;
    status : ProjectStatus;
    createdAt : Int;
    script : ?Script;
    scenes : ?[Scene];
  };

  type ProjectInput = {
    topic : Text;
    goal : ProjectGoal;
    audience : ProjectAudience;
    style : ProjectStyle;
    platform : ProjectPlatform;
    voiceoverType : VoiceoverType;
  };

  func goalText(g : ProjectGoal) : Text {
    switch g { case (#educate) "educate"; case (#sell) "sell"; case (#inspire) "inspire"; case (#explain) "explain" };
  };
  func audienceText(a : ProjectAudience) : Text {
    switch a { case (#beginners) "beginners"; case (#students) "students"; case (#professionals) "professionals" };
  };
  func styleText(s : ProjectStyle) : Text {
    switch s { case (#cinematic) "cinematic"; case (#minimal) "minimal"; case (#threeD) "3D"; case (#social) "social" };
  };
  func platformText(p : ProjectPlatform) : Text {
    switch p { case (#tiktok) "TikTok"; case (#youtube) "YouTube" };
  };

  // ── State ─────────────────────────────────────────────────────────────────
  var projectIdCounter = 0;
  let projects = Map.empty<Nat, Project>();

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  func getProjectInternal(id : Nat) : Project {
    switch (projects.get(id)) {
      case (null) { Runtime.trap("Project not found") };
      case (?p) { p };
    };
  };

  // ── OpenAI helper ─────────────────────────────────────────────────────────
  // Returns the raw OpenAI HTTP response body so the frontend can parse it.
  // The frontend is better suited to JSON string unescaping than Motoko.
  func stripNewlines(t : Text) : Text {
    t.replace(#char '\n', " ").replace(#char '\r', " ");
  };

  func callOpenAI(systemPrompt : Text, userPrompt : Text) : async Text {
    if (openAIKey.size() == 0) {
      Runtime.trap("OpenAI API key not configured. An admin must set it first.");
    };

    let sp = stripNewlines(systemPrompt);
    let up = stripNewlines(userPrompt);

    let body = "{\"model\":\"gpt-4o\",\"temperature\":0.7,\"messages\":[{\"role\":\"system\",\"content\":\"" # sp # "\"},{\"role\":\"user\",\"content\":\"" # up # "\"}]}";

    let headers : [OutCall.Header] = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Authorization"; value = "Bearer " # openAIKey },
    ];

    // Return the raw OpenAI response — the frontend handles JSON extraction/parsing
    await OutCall.httpPostRequest(
      "https://api.openai.com/v1/chat/completions",
      headers,
      body,
      transform,
    );
  };

  // ── Project CRUD ──────────────────────────────────────────────────────────
  public shared ({ caller }) func createProject(input : ProjectInput) : async Nat {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };
    if (input.topic.size() == 0) { Runtime.trap("Topic cannot be empty") };

    let id = projectIdCounter;
    projects.add(id, {
      id;
      owner = caller;
      topic = input.topic;
      goal = input.goal;
      audience = input.audience;
      style = input.style;
      platform = input.platform;
      voiceoverType = input.voiceoverType;
      customScript = null;
      status = #draft;
      createdAt = Time.now();
      script = null;
      scenes = null;
    });
    projectIdCounter += 1;
    id;
  };

  public query ({ caller }) func getProject(id : Nat) : async Project {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(id);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    p;
  };

  public query ({ caller }) func getUserProjects() : async [Project] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    projects.values().toArray().filter(func(p) { p.owner == caller }).sort(
      func(a, b) { Nat.compare(a.id, b.id) }
    );
  };

  public shared ({ caller }) func updateProjectScript(projectId : Nat, script : Script) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.add(projectId, { p with status = #scripted; script = ?script });
  };

  public shared ({ caller }) func updateProjectStatus(projectId : Nat, status : ProjectStatus) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.add(projectId, { p with status });
  };

  public shared ({ caller }) func deleteProject(id : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(id);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.remove(id);
  };

  // ── AI Generation ─────────────────────────────────────────────────────────
  public shared ({ caller }) func generateScript(projectId : Nat) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };

    let systemPrompt = "You are an expert viral video scriptwriter. You write short, high-retention scripts following the structure: HOOK, PATTERN INTERRUPT, VALUE, PAYOFF, CTA. Respond with valid JSON only. No markdown, no explanation.";
    let userPrompt = "Write a viral " # platformText(p.platform) # " video script about: " # p.topic # ". Goal: " # goalText(p.goal) # ". Audience: " # audienceText(p.audience) # ". Style: " # styleText(p.style) # ". Return a JSON object with exactly these string keys: hook, patternInterrupt, value, main, cta. Each is 2-4 punchy sentences optimized for short-form video.";

    await callOpenAI(systemPrompt, userPrompt);
  };

  public shared ({ caller }) func generateScenes(projectId : Nat) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };

    let scriptText = switch (p.script) {
      case (null) { "Topic: " # p.topic };
      case (?s) { "Hook: " # s.hook # " Pattern interrupt: " # s.patternInterrupt # " Value: " # s.value # " Main: " # s.main # " CTA: " # s.cta };
    };

    let systemPrompt = "You are a video director and scene planner. Break scripts into vivid cinematically described scenes. Respond with valid JSON only. No markdown, no explanation.";
    let userPrompt = "Break this into 4-6 scenes for a " # styleText(p.style) # " " # platformText(p.platform) # " video. Script: " # scriptText # ". Return a JSON array. Each item: index (number, 0-based), title (short string), visualDescription (string, 1-2 sentences), voiceoverLine (string, 1-2 sentences), duration (number, 3-8 seconds).";

    await callOpenAI(systemPrompt, userPrompt);
  };

  public shared ({ caller }) func updateProjectScenes(projectId : Nat, scenes : [Scene]) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.add(projectId, { p with status = #scenes_ready; scenes = ?scenes });
  };

  public shared ({ caller }) func updateCustomScript(projectId : Nat, customScript : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) { Runtime.trap("Unauthorized") };
    let p = getProjectInternal(projectId);
    if (p.owner != caller and not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.add(projectId, { p with customScript = ?customScript });
  };

  // ── Admin ─────────────────────────────────────────────────────────────────
  public query ({ caller }) func getProjectCount() : async Nat {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.size();
  };

  public query ({ caller }) func getAllProjects() : async [Project] {
    if (not AccessControl.isAdmin(accessControlState, caller)) { Runtime.trap("Unauthorized") };
    projects.values().toArray().sort(func(a, b) { Nat.compare(a.id, b.id) });
  };
};
