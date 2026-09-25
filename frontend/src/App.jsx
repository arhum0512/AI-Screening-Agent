import { useRef, useState } from "react";

import {
  UploadCloud,
  FileText,
  SlidersHorizontal,
  Sparkles,
  CheckCircle2,
  Play,
  ShieldCheck,
  Database,
  Settings2,
  ChevronRight,
  AlertCircle,
  LoaderCircle,
  Globe2,
  Download
} from "lucide-react";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "";
function App() {
  const [companyMode, setCompanyMode] = useState("file");
  const [promptMode, setPromptMode] = useState("default");
  const [scoringMode, setScoringMode] = useState("default");

  const [companiesFile, setCompaniesFile] = useState(null);
  const [promptFile, setPromptFile] = useState(null);
  const [scoringFile, setScoringFile] = useState(null);

  const [websitesText, setWebsitesText] = useState("");
  const [promptText, setPromptText] = useState("");
  const [scoringText, setScoringText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [screeningResult, setScreeningResult] = useState(null);

  const companiesInputRef = useRef(null);
  const promptInputRef = useRef(null);
  const scoringInputRef = useRef(null);


  function clearResult() {
    setMessage("");
    setMessageType("");
    setScreeningResult(null);
  }


  function handleCompanyMode(mode) {
    setCompanyMode(mode);

    if (mode === "file") {
      setWebsitesText("");
    }

    if (mode === "manual") {
      setCompaniesFile(null);

      if (companiesInputRef.current) {
        companiesInputRef.current.value = "";
      }
    }

    clearResult();
  }


  function handlePromptMode(mode) {
    setPromptMode(mode);

    if (mode !== "file") {
      setPromptFile(null);

      if (promptInputRef.current) {
        promptInputRef.current.value = "";
      }
    }

    if (mode !== "manual") {
      setPromptText("");
    }

    clearResult();
  }


  function handleScoringMode(mode) {
    setScoringMode(mode);

    if (mode !== "file") {
      setScoringFile(null);

      if (scoringInputRef.current) {
        scoringInputRef.current.value = "";
      }
    }

    if (mode !== "manual") {
      setScoringText("");
    }

    clearResult();
  }


  function handleCompaniesFile(event) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    setCompaniesFile(file);
    clearResult();
  }


  function handlePromptFile(event) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    setPromptFile(file);
    clearResult();
  }


  function handleScoringFile(event) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      return;
    }

    setScoringFile(file);
    clearResult();
  }


  function hasCompanyInput() {
    if (companyMode === "file") {
      return Boolean(
        companiesFile
      );
    }

    return Boolean(
      websitesText.trim()
    );
  }


  async function handleRunScreening() {
    if (!hasCompanyInput()) {
      setMessageType("error");

      setMessage(
        companyMode === "file"
          ? "Please select a company website CSV file first."
          : "Please enter at least one website first."
      );

      return;
    }


    if (
      promptMode === "manual" &&
      !promptText.trim()
    ) {
      setMessageType("error");

      setMessage(
        "Please write a screening prompt or select Default."
      );

      return;
    }


    if (
      scoringMode === "manual" &&
      !scoringText.trim()
    ) {
      setMessageType("error");

      setMessage(
        "Please enter scoring JSON or select Default."
      );

      return;
    }


    if (
      scoringMode === "manual"
    ) {
      try {
        JSON.parse(
          scoringText
        );

      } catch {
        setMessageType("error");

        setMessage(
          "The manually entered scoring configuration is not valid JSON."
        );

        return;
      }
    }


    if (
      promptMode === "file" &&
      !promptFile
    ) {
      setMessageType("error");

      setMessage(
        "Please select a prompt file or choose Default."
      );

      return;
    }


    if (
      scoringMode === "file" &&
      !scoringFile
    ) {
      setMessageType("error");

      setMessage(
        "Please select a scoring JSON file or choose Default."
      );

      return;
    }


    if (isSubmitting) {
      return;
    }


    const formData =
      new FormData();


    if (
      companyMode === "file"
    ) {
      formData.append(
        "companies",
        companiesFile
      );

    } else {
      formData.append(
        "websitesText",
        websitesText
      );
    }


    if (
      promptMode === "file" &&
      promptFile
    ) {
      formData.append(
        "prompt",
        promptFile
      );
    }


    if (
      promptMode === "manual"
    ) {
      formData.append(
        "promptText",
        promptText
      );
    }


    if (
      scoringMode === "file" &&
      scoringFile
    ) {
      formData.append(
        "scoring",
        scoringFile
      );
    }


    if (
      scoringMode === "manual"
    ) {
      formData.append(
        "scoringText",
        scoringText
      );
    }


    try {
      setIsSubmitting(true);

      setMessage("");
      setMessageType("");
      setScreeningResult(null);


      const response =
        await fetch(
          `${API_BASE_URL}/api/upload`,
          {
            method: "POST",
            body: formData
          }
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.message ||
          "Screening request failed."
        );
      }


      setScreeningResult(
        data
      );


      if (data.success) {
        setMessageType(
          "success"
        );

        setMessage(
          `Screening completed successfully. ${data.summary.successfulCompanies} of ${data.summary.totalCompanies} companies were screened successfully.`
        );

      } else {
        setMessageType(
          "error"
        );

        setMessage(
          data.message ||
          "Screening completed, but no successful results were generated."
        );
      }


    } catch (error) {
      setMessageType(
        "error"
      );

      setMessage(
        error.message ||
        "Unable to connect to the backend server."
      );


    } finally {
      setIsSubmitting(
        false
      );
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EAF2FF] via-[#F5F8FF] to-[#E6F7FB] text-slate-900">

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-blue-300/45 blur-[140px]" />

        <div className="absolute right-[-140px] top-10 h-[32rem] w-[32rem] rounded-full bg-indigo-300/35 blur-[150px]" />

        <div className="absolute bottom-[-180px] left-1/3 h-[30rem] w-[30rem] rounded-full bg-cyan-300/40 blur-[145px]" />

      </div>


      <div className="relative mx-auto max-w-7xl px-6 py-8 lg:px-8">

        {/* Header */}
        <header className="flex items-start justify-between border-b border-slate-300/70 pb-6">

          <div className="flex items-start gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_28px_rgba(59,130,246,0.30)]">

              <Sparkles
                size={23}
                strokeWidth={2.2}
              />

            </div>


            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-blue-700">
                AI Screening Platform
              </p>

              <h1 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                Website Screening Agent
              </h1>

              <p className="mt-2 text-sm text-slate-9500">
                AI-powered research, trigger detection and scoring
              </p>

            </div>

          </div>


          <div className="hidden items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-xs text-slate-600 lg:flex">

            <ShieldCheck
              size={14}
              className="text-blue-700"
            />

            Secure server-side AI

          </div>

        </header>


        {/* Hero */}
        <section className="grid gap-10 pb-16 pt-14 lg:grid-cols-[1.35fr_0.65fr] lg:items-center lg:gap-16 lg:pt-16">

          <div>

            <div className="mb-5 flex items-center gap-3">

              <span className="h-px w-8 bg-blue-400" />

              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">
                Intelligent company screening
              </span>

            </div>


            <h2 className="max-w-3xl text-4xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl lg:text-[3.6rem] lg:leading-[1.3]">

              Screen companies with

              <span className="mt-2 block bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                intelligent automation
              </span>

            </h2>


            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">

              Research company websites, identify business signals and calculate
              structured scores using your configurable screening logic.

            </p>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-9500">

              Upload files or enter websites, prompts and scoring configuration
              directly in the dashboard.

            </p>

          </div>


          {/* Workflow */}
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-b from-white/90 to-blue-50/70 p-6 shadow-2xl shadow-blue-900/10 backdrop-blur-xl">

            <div className="mb-6">

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-9500">
                Screening Workflow
              </p>

              <h3 className="mt-2 text-lg font-bold text-slate-900">
                From websites to results
              </h3>

            </div>


            <div className="space-y-3">

              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">
                  <Globe2 size={18} />
                </div>


                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Add websites
                  </p>

                  <p className="mt-1 text-xs text-slate-9500">
                    Upload CSV or enter websites manually.
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700">
                  <Settings2 size={18} />
                </div>


                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Apply configuration
                  </p>

                  <p className="mt-1 text-xs text-slate-9500">
                    Use default, uploaded or manually written settings.
                  </p>

                </div>

              </div>


              <div className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white/80 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">
                  <CheckCircle2 size={18} />
                </div>


                <div>

                  <p className="text-sm font-semibold text-slate-900">
                    Generate results
                  </p>

                  <p className="mt-1 text-xs text-slate-9500">
                    Research, analyze and score companies.
                  </p>

                </div>

              </div>

            </div>

          </div>

        </section>


        {/* Company Input */}
        <section className="rounded-3xl border border-blue-200/80 bg-white/80 p-6 shadow-2xl shadow-blue-900/10">

          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">
                <Globe2 size={21} />
              </div>


              <div>

                <h3 className="text-xl font-bold text-slate-950">
                  Company Websites
                </h3>

                <p className="mt-1 text-sm text-slate-9500">
                  Required input
                </p>

              </div>

            </div>


            <div className="flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCompanyMode("file")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  companyMode === "file"
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Upload CSV
              </button>


              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleCompanyMode("manual")}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  companyMode === "manual"
                    ? "bg-blue-500 text-white"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Enter Websites
              </button>

            </div>

          </div>


          {companyMode === "file" ? (

            <div className="mt-6 rounded-2xl border border-dashed border-blue-300/80 bg-blue-50/70 p-7 text-center">

              <input
                ref={companiesInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCompaniesFile}
                className="hidden"
              />


              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-700">

                {companiesFile ? (
                  <CheckCircle2
                    size={28}
                    className="text-emerald-400"
                  />
                ) : (
                  <Database size={28} />
                )}

              </div>


              <p className="mt-4 text-sm font-semibold text-slate-900">

                {companiesFile
                  ? companiesFile.name
                  : "Upload company list"}

              </p>


              <p className="mt-2 text-xs text-slate-9500">
                CSV format
              </p>


              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => companiesInputRef.current?.click()}
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <UploadCloud size={17} />

                {companiesFile
                  ? "Change File"
                  : "Choose CSV"}

              </button>

            </div>

          ) : (

            <div className="mt-6">

              <label className="mb-3 block text-sm font-semibold text-slate-300">
                Enter one website per line
              </label>


              <textarea
                value={websitesText}
                disabled={isSubmitting}
                onChange={(event) => {

                  setWebsitesText(
                    event.target.value
                  );

                  clearResult();

                }}
                rows={7}
                placeholder="https://example.com"
                className="w-full resize-y rounded-2xl border border-blue-400/20 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400/50 focus:ring-2 focus:ring-blue-500/10"
              />


              <p className="mt-3 text-xs text-slate-9500">
                You can enter a single website or multiple websites.
              </p>

            </div>

          )}

        </section>


        {/* Configuration */}
        <section className="mt-6 grid gap-6 xl:grid-cols-2">

          {/* Prompt */}
          <div className="rounded-3xl border border-indigo-200/80 bg-white/80 p-6 shadow-2xl shadow-blue-900/10">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-700 ring-1 ring-indigo-400/20">
                <FileText size={23} />
              </div>


              <div>

                <h3 className="text-xl font-bold text-slate-950">
                  Screening Prompt
                </h3>

                <p className="mt-1 text-sm text-slate-9500">
                  Optional
                </p>

              </div>

            </div>


            <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1">

              {[
                ["default", "Default"],
                ["file", "Upload"],
                ["manual", "Write"]
              ].map(([mode, label]) => (

                <button
                  key={mode}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handlePromptMode(mode)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    promptMode === mode
                      ? "bg-indigo-500 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>

              ))}

            </div>


            {promptMode === "default" && (

              <div className="mt-6 rounded-2xl border border-indigo-200/70 bg-indigo-50/70 p-5">

                <CheckCircle2
                  size={22}
                  className="text-indigo-700"
                />

                <p className="mt-3 font-semibold text-slate-900">
                  Default prompt active
                </p>

                <p className="mt-2 text-sm text-slate-9500">
                  The saved backend screening prompt will be used.
                </p>

              </div>

            )}


            {promptMode === "file" && (

              <div className="mt-6 rounded-2xl border border-dashed border-indigo-300/80 bg-indigo-50/70 p-6 text-center">

                <input
                  ref={promptInputRef}
                  type="file"
                  accept=".md,.txt,text/plain,text/markdown"
                  onChange={handlePromptFile}
                  className="hidden"
                />


                <FileText
                  size={28}
                  className="mx-auto text-indigo-700"
                />


                <p className="mt-4 break-all text-sm font-semibold text-slate-900">

                  {promptFile
                    ? promptFile.name
                    : "No prompt file selected"}

                </p>


                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => promptInputRef.current?.click()}
                  className="mt-5 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/15"
                >

                  {promptFile
                    ? "Change Prompt"
                    : "Choose Prompt"}

                </button>

              </div>

            )}


            {promptMode === "manual" && (

              <div className="mt-6">

                <label className="mb-3 block text-sm font-semibold text-slate-300">
                  Write or paste screening prompt
                </label>


                <textarea
                  value={promptText}
                  disabled={isSubmitting}
                  onChange={(event) => {

                    setPromptText(
                      event.target.value
                    );

                    clearResult();

                  }}
                  rows={10}
                  placeholder="Write additional screening instructions here..."
                  className="w-full resize-y rounded-2xl border border-indigo-400/20 bg-white/90 px-5 py-4 text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-400/50 focus:ring-2 focus:ring-indigo-500/10"
                />

              </div>

            )}

          </div>


          {/* Scoring */}
          <div className="rounded-3xl border border-cyan-200/80 bg-white/80 p-6 shadow-2xl shadow-blue-900/10">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-400/20">
                <SlidersHorizontal size={23} />
              </div>


              <div>

                <h3 className="text-xl font-bold text-slate-950">
                  Scoring Configuration
                </h3>

                <p className="mt-1 text-sm text-slate-9500">
                  Optional
                </p>

              </div>

            </div>


            <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1">

              {[
                ["default", "Default"],
                ["file", "Upload"],
                ["manual", "Write"]
              ].map(([mode, label]) => (

                <button
                  key={mode}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleScoringMode(mode)}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    scoringMode === mode
                      ? "bg-cyan-500 text-white"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {label}
                </button>

              ))}

            </div>


            {scoringMode === "default" && (

              <div className="mt-6 rounded-2xl border border-cyan-200/70 bg-cyan-50/70 p-5">

                <CheckCircle2
                  size={22}
                  className="text-cyan-700"
                />

                <p className="mt-3 font-semibold text-slate-900">
                  Default scoring active
                </p>

                <p className="mt-2 text-sm text-slate-9500">
                  The saved backend trigger and scoring configuration will be used.
                </p>

              </div>

            )}


            {scoringMode === "file" && (

              <div className="mt-6 rounded-2xl border border-dashed border-cyan-300/80 bg-cyan-50/70 p-6 text-center">

                <input
                  ref={scoringInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleScoringFile}
                  className="hidden"
                />


                <Settings2
                  size={28}
                  className="mx-auto text-cyan-700"
                />


                <p className="mt-4 break-all text-sm font-semibold text-slate-900">

                  {scoringFile
                    ? scoringFile.name
                    : "No scoring file selected"}

                </p>


                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => scoringInputRef.current?.click()}
                  className="mt-5 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-500/15"
                >

                  {scoringFile
                    ? "Change Scoring"
                    : "Choose JSON"}

                </button>

              </div>

            )}


            {scoringMode === "manual" && (

              <div className="mt-6">

                <label className="mb-3 block text-sm font-semibold text-slate-300">
                  Write or paste scoring JSON
                </label>


                <textarea
                  value={scoringText}
                  disabled={isSubmitting}
                  onChange={(event) => {

                    setScoringText(
                      event.target.value
                    );

                    clearResult();

                  }}
                  rows={10}
                  spellCheck={false}
                  placeholder={`{
  "growth_triggers": [],
  "pain_point_triggers": [],
  "workflow_tool_triggers": []
}`}
                  className="w-full resize-y rounded-2xl border border-cyan-400/20 bg-white/90 px-5 py-4 font-mono text-sm leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-500/10"
                />

              </div>

            )}

          </div>

        </section>


        {/* Active Configuration */}
        <section className="mt-8 rounded-3xl border border-slate-200/80 bg-white/75 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-xl">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">
              <Settings2 size={20} />
            </div>


            <div>

              <h3 className="font-bold text-slate-950">
                Active Configuration
              </h3>

              <p className="text-sm text-slate-9500">
                Input methods selected for this screening run.
              </p>

            </div>

          </div>


          <div className="grid gap-4 lg:grid-cols-3">

            <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-9500">
                Companies
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-900">

                {companyMode === "file"
                  ? companiesFile?.name || "CSV not selected"
                  : websitesText.trim()
                    ? "Manual website entry"
                    : "No websites entered"}

              </p>

            </div>


            <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-9500">
                Prompt
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-900">

                {promptMode === "default"
                  ? "Default Prompt"
                  : promptMode === "file"
                    ? promptFile?.name || "File not selected"
                    : promptText.trim()
                      ? "Manual Prompt"
                      : "Prompt not written"}

              </p>

            </div>


            <div className="rounded-2xl border border-slate-200/80 bg-white/85 px-5 py-4">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-9500">
                Scoring
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-900">

                {scoringMode === "default"
                  ? "Default Scoring"
                  : scoringMode === "file"
                    ? scoringFile?.name || "File not selected"
                    : scoringText.trim()
                      ? "Manual Scoring"
                      : "Scoring not written"}

              </p>

            </div>

          </div>

        </section>


        {/* Processing */}
        {isSubmitting && (

          <section className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/90 p-5">

            <div className="flex items-start gap-4">

              <LoaderCircle
                size={22}
                className="mt-0.5 shrink-0 animate-spin text-blue-700"
              />


              <div>

                <p className="font-semibold text-blue-900">
                  Screening in progress
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-700">
                  Researching company websites, analyzing business signals and
                  generating AI screening results. This may take several minutes.
                </p>

              </div>

            </div>

          </section>

        )}


        {/* Message */}
        {!isSubmitting && message && (

          <section
            className={`mt-6 rounded-2xl border p-5 ${
              messageType === "success"
                ? "border-emerald-400/20 bg-emerald-400/[0.06]"
                : "border-red-400/20 bg-red-400/[0.06]"
            }`}
          >

            <div className="flex items-start gap-3">

              {messageType === "success" ? (

                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-emerald-400"
                />

              ) : (

                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-400"
                />

              )}


              <p
                className={`text-sm leading-6 ${
                  messageType === "success"
                    ? "text-emerald-800"
                    : "text-red-800"
                }`}
              >
                {message}
              </p>

            </div>

          </section>

        )}


        {/* Results */}
        {!isSubmitting && screeningResult && (

          <section className="mt-6 rounded-3xl border border-slate-200/80 bg-white/85 p-6 shadow-xl shadow-blue-900/10">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Screening Result
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-950">
                  Screening Summary
                </h3>

              </div>


              <span
                className={`rounded-full border px-4 py-2 text-xs font-semibold ${
                  screeningResult.success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >

                {screeningResult.success
                  ? "Completed"
                  : "Completed with issues"}

              </span>

            </div>


            {/* Summary Cards */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">

              <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-5">

                <p className="text-xs uppercase tracking-[0.16em] text-slate-9500">
                  Total Companies
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-950">
                  {screeningResult.summary?.totalCompanies ?? 0}
                </p>

              </div>


              <div className="rounded-2xl border border-emerald-400/10 bg-white/85 p-5">

                <p className="text-xs uppercase tracking-[0.16em] text-slate-9500">
                  Successful
                </p>

                <p className="mt-3 text-3xl font-bold text-emerald-400">
                  {screeningResult.summary?.successfulCompanies ?? 0}
                </p>

              </div>


              <div className="rounded-2xl border border-red-400/10 bg-white/85 p-5">

                <p className="text-xs uppercase tracking-[0.16em] text-slate-9500">
                  Failed
                </p>

                <p className="mt-3 text-3xl font-bold text-red-600">
                  {screeningResult.summary?.failedCompanies ?? 0}
                </p>

              </div>

            </div>


            {/* Downloads */}
            <div className="mt-8 border-t border-slate-200/80 pt-7">

              <div>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-9500">
                  Result Files
                </p>

                <h4 className="mt-2 text-lg font-bold text-slate-900">
                  Download screening results
                </h4>

                <p className="mt-2 text-sm text-slate-9500">
                  Download the CSV files generated by the latest screening run.
                </p>

              </div>


              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                {screeningResult.files?.summary && (

                  <a
                   href={`${API_BASE_URL}/api/download/summary`}
                    className="group flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50/80 p-5 transition hover:border-blue-300 hover:bg-blue-100/80"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700">

                        <Download size={20} />

                      </div>


                      <div>

                        <p className="font-semibold text-slate-900">
                          Screening Results
                        </p>

                        <p className="mt-1 text-xs text-slate-9500">
                          screened-companies.csv
                        </p>

                      </div>

                    </div>


                    <ChevronRight
                      size={18}
                      className="text-slate-9500 transition group-hover:translate-x-1 group-hover:text-blue-700"
                    />

                  </a>

                )}


                {screeningResult.files?.triggers && (

                  <a
                    href={`${API_BASE_URL}/api/download/triggers`}
                    className="group flex items-center justify-between rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 transition hover:border-indigo-300 hover:bg-indigo-100/80"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-700">

                        <Download size={20} />

                      </div>


                      <div>

                        <p className="font-semibold text-slate-900">
                          Detected Triggers
                        </p>

                        <p className="mt-1 text-xs text-slate-9500">
                          detected-triggers.csv
                        </p>

                      </div>

                    </div>


                    <ChevronRight
                      size={18}
                      className="text-slate-9500 transition group-hover:translate-x-1 group-hover:text-indigo-700"
                    />

                  </a>

                )}


                {screeningResult.files?.evidence && (

                  <a
                   href={`${API_BASE_URL}/api/download/evidence`}
                    className="group flex items-center justify-between rounded-2xl border border-cyan-200 bg-cyan-50/80 p-5 transition hover:border-cyan-300 hover:bg-cyan-100/80"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700">

                        <Download size={20} />

                      </div>


                      <div>

                        <p className="font-semibold text-slate-900">
                          Evidence
                        </p>

                        <p className="mt-1 text-xs text-slate-9500">
                          evidence.csv
                        </p>

                      </div>

                    </div>


                    <ChevronRight
                      size={18}
                      className="text-slate-9500 transition group-hover:translate-x-1 group-hover:text-cyan-700"
                    />

                  </a>

                )}


                {screeningResult.files?.failed && (

                  <a
                    href={`${API_BASE_URL}/api/download/failed`}
                    className="group flex items-center justify-between rounded-2xl border border-red-200 bg-red-50/80 p-5 transition hover:border-red-300 hover:bg-red-100/80"
                  >

                    <div className="flex items-center gap-4">

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">

                        <Download size={20} />

                      </div>


                      <div>

                        <p className="font-semibold text-slate-900">
                          Failed Companies
                        </p>

                        <p className="mt-1 text-xs text-slate-9500">
                          failed-companies.csv
                        </p>

                      </div>

                    </div>


                    <ChevronRight
                      size={18}
                      className="text-slate-9500 transition group-hover:translate-x-1 group-hover:text-red-600"
                    />

                  </a>

                )}

              </div>

            </div>

          </section>

        )}


        {/* Run Panel */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-blue-200/80 bg-gradient-to-r from-blue-100/80 via-indigo-50/80 to-cyan-100/80 p-6 shadow-2xl shadow-blue-900/10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            {!isSubmitting && (

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-400/10 text-blue-700">

                  {hasCompanyInput() ? (

                    <CheckCircle2
                      size={24}
                      className="text-emerald-700"
                    />

                  ) : (

                    <UploadCloud size={24} />

                  )}

                </div>


                <div>

                  <h3 className="text-xl font-bold text-slate-950">

                    {screeningResult
                      ? "Screening completed"
                      : hasCompanyInput()
                        ? "Ready to start screening"
                        : "Company input required"}

                  </h3>


                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">

                    {screeningResult
                      ? "Review your results above or download the generated CSV files."
                      : "Choose your company input and configuration, then start the screening process."}

                  </p>

                </div>

              </div>

            )}


            <button
              type="button"
              onClick={handleRunScreening}
              disabled={!hasCompanyInput() || isSubmitting}
              className={`group inline-flex min-w-52 items-center justify-center gap-3 rounded-2xl px-6 py-4 text-sm font-bold transition ${
                hasCompanyInput() && !isSubmitting
                  ? "bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 text-white shadow-xl shadow-blue-500/25 hover:scale-[1.02]"
                  : "cursor-not-allowed border border-slate-200 bg-white/60 text-slate-400"
              }`}
            >

              {isSubmitting ? (

                <LoaderCircle
                  size={18}
                  className="animate-spin"
                />

              ) : (

                <Play
                  size={18}
                  fill="currentColor"
                />

              )}


              {isSubmitting
                ? "Screening..."
                : screeningResult
                  ? "Run Again"
                  : "Run Screening"}


              {!isSubmitting && hasCompanyInput() && (

                <ChevronRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />

              )}

            </button>

          </div>

        </section>


        {/* Footer */}
        <footer className="mt-8 flex flex-col gap-3 border-t border-slate-200/80 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <p>
            AI Website Screening Agent
          </p>

          <p>
            API credentials remain securely on the backend server.
          </p>

        </footer>

      </div>

    </div>
  );
}


export default App;