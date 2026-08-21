"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AiPolicyStatus,
  PublicationSource,
  PublicationTechnicalProfile as TechnicalProfile,
  ResolvedPublicationTarget,
  ResolutionOrigin,
} from "../../lib/publications/types";


type JournalStepProps = {
  publisher: string;

  setPublisher:
    (value: string) => void;

  journal: string;

  setJournal:
    (value: string) => void;

  artworkType: string;

  setArtworkType:
    (value: string) => void;

  manualPolicyConfirmed:
    boolean;

  setManualPolicyConfirmed:
    (value: boolean) => void;

  onBack: () => void;

  onContinue: () => void;
};


type PublicationSearchResult = {
  journalId: string;

  journalName: string;

  publisherId: string;

  publisherName: string;

  disciplines: string[];

  hasVerifiedProfiles: boolean;
};


type PublicationSearchResponse = {
  query: string;

  count: number;

  results:
    PublicationSearchResult[];
};


type ResolveResponse = {
  resolved:
    ResolvedPublicationTarget;

  sources:
    PublicationSource[];
};


const ARTWORK_TYPES = [
  {
    label: "Journal Cover",
    value: "Front Cover",
    description:
      "Create publication-ready cover artwork tailored to the selected journal.",
  },
  {
    label: "Graphical Abstract",
    value: "Graphical Abstract",
    description:
      "Create a concise visual summary of the research for publication.",
  },
] as const;


export default function JournalStep({
  publisher,
  setPublisher,
  journal,
  setJournal,
  artworkType,
  setArtworkType,

  manualPolicyConfirmed,
  setManualPolicyConfirmed,

  onBack,
  onContinue,
}: JournalStepProps) {
  const [
    journalQuery,
    setJournalQuery,
  ] =
    useState(
      journal
    );

  const [
    searchResults,
    setSearchResults,
  ] =
    useState<
      PublicationSearchResult[]
    >([]);

  const [
    selectedResult,
    setSelectedResult,
  ] =
    useState<
      PublicationSearchResult | null
    >(null);

  const [
    isSearching,
    setIsSearching,
  ] =
    useState(
      false
    );

  const [
    searchError,
    setSearchError,
  ] =
    useState<
      string | null
    >(null);

  const [
    showResults,
    setShowResults,
  ] =
    useState(
      false
    );


  /*
   * Resolver state.
   */

  const [
    resolvedTarget,
    setResolvedTarget,
  ] =
    useState<
      ResolvedPublicationTarget | null
    >(null);

  const [
    resolutionSources,
    setResolutionSources,
  ] =
    useState<
      PublicationSource[]
    >([]);

  const [
    isResolving,
    setIsResolving,
  ] =
    useState(
      false
    );

  const [
    resolutionError,
    setResolutionError,
  ] =
    useState<
      string | null
    >(null);


  const searchRequestIdRef =
    useRef(
      0
    );

  const resolveRequestIdRef =
    useRef(
      0
    );

  /*
   * An author acknowledgement is valid only
   * for the exact publisher + journal +
   * artwork-type target that was reviewed.
   *
   * If the target changes, require a fresh
   * acknowledgement.
   */
  const previousPolicyTarget =
    useRef(
      ""
    );

  useEffect(
    () => {
      const target = [
        publisher.trim(),
        journal.trim(),
        artworkType,
      ].join(
        "::"
      );

      if (
        previousPolicyTarget.current &&
        previousPolicyTarget.current !==
          target
      ) {
        setManualPolicyConfirmed(
          false
        );
      }

      previousPolicyTarget.current =
        target;
    },
    [
      publisher,
      journal,
      artworkType,
      setManualPolicyConfirmed,
    ]
  );


  /*
   * Keep local journal input synchronized
   * with the existing parent-owned state.
   */

  useEffect(
    () => {
      if (
        journal !==
          journalQuery &&
        selectedResult?.journalName !==
          journal
      ) {
        setJournalQuery(
          journal
        );
      }
    },
    [
      journal,
      journalQuery,
      selectedResult,
    ]
  );


  /*
   * Publication registry search.
   */

  useEffect(
    () => {
      const query =
        journalQuery.trim();

      if (
        query.length <
        2
      ) {
        setSearchResults(
          []
        );

        setSearchError(
          null
        );

        setIsSearching(
          false
        );

        return;
      }


      if (
        selectedResult &&
        selectedResult.journalName ===
          query
      ) {
        setSearchResults(
          []
        );

        setIsSearching(
          false
        );

        return;
      }


      const timer =
        window.setTimeout(
          async () => {
            const requestId =
              ++searchRequestIdRef.current;

            setIsSearching(
              true
            );

            setSearchError(
              null
            );

            try {
              const params =
                new URLSearchParams({
                  q:
                    query,

                  limit:
                    "12",
                });

              const response =
                await fetch(
                  `/api/publications/search?${params.toString()}`,
                  {
                    method:
                      "GET",

                    cache:
                      "no-store",
                  }
                );

              const data =
                await readJsonResponse(
                  response
                );


              if (
                requestId !==
                  searchRequestIdRef.current
              ) {
                return;
              }


              if (
                !response.ok
              ) {
                throw new Error(
                  getApiError(
                    data,
                    `Publication search failed with HTTP ${response.status}.`
                  )
                );
              }


              if (
                !isSearchResponse(
                  data
                )
              ) {
                throw new Error(
                  "The publication search endpoint returned an invalid response."
                );
              }


              setSearchResults(
                data.results
              );

              setShowResults(
                true
              );
            } catch (
              error
            ) {
              if (
                requestId !==
                  searchRequestIdRef.current
              ) {
                return;
              }

              console.error(
                "Journal search error:",
                error
              );

              setSearchResults(
                []
              );

              setSearchError(
                error instanceof
                  Error
                  ? error.message
                  : "Could not search the publication registry."
              );
            } finally {
              if (
                requestId ===
                  searchRequestIdRef.current
              ) {
                setIsSearching(
                  false
                );
              }
            }
          },
          300
        );


      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      journalQuery,
      selectedResult,
    ]
  );


  /*
   * Resolve the EXACT selected
   * journal + artwork type.
   *
   * This is intentionally separate from
   * hasVerifiedProfiles in search results.
   */

  useEffect(
    () => {
      const typedPublisher =
        publisher.trim();

      const typedJournal =
        journal.trim();

      if (
        !artworkType ||
        (
          !selectedResult &&
          (
            !typedPublisher ||
            !typedJournal
          )
        )
      ) {
        resolveRequestIdRef.current +=
          1;

        setResolvedTarget(
          null
        );

        setResolutionSources(
          []
        );

        setResolutionError(
          null
        );

        setIsResolving(
          false
        );

        return;
      }


      const timer =
        window.setTimeout(
          async () => {
            const requestId =
              ++resolveRequestIdRef.current;

            setIsResolving(
              true
            );

            setResolutionError(
              null
            );

            setResolvedTarget(
              null
            );

            setResolutionSources(
              []
            );

            try {
              const params =
                selectedResult
                  ? new URLSearchParams({
                      publisherId:
                        selectedResult.publisherId,

                      journalId:
                        selectedResult.journalId,

                      artworkType,
                    })
                  : new URLSearchParams({
                      publisher:
                        typedPublisher,

                      journal:
                        typedJournal,

                      artworkType,
                    });

              const response =
                await fetch(
                  `/api/publications/resolve?${params.toString()}`,
                  {
                    method:
                      "GET",

                    cache:
                      "no-store",
                  }
                );

              const data =
                await readJsonResponse(
                  response
                );


              if (
                requestId !==
                  resolveRequestIdRef.current
              ) {
                return;
              }


              if (
                !response.ok
              ) {
                throw new Error(
                  getApiError(
                    data,
                    `Publication resolution failed with HTTP ${response.status}.`
                  )
                );
              }


              if (
                !isResolveResponse(
                  data
                )
              ) {
                throw new Error(
                  "The publication resolver returned an invalid response."
                );
              }


              setResolvedTarget(
                data.resolved
              );

              setResolutionSources(
                data.sources
              );
            } catch (
              error
            ) {
              if (
                requestId !==
                  resolveRequestIdRef.current
              ) {
                return;
              }

              console.error(
                "Publication resolution error:",
                error
              );

              setResolutionError(
                error instanceof
                  Error
                  ? error.message
                  : "Could not resolve publication requirements."
              );
            } finally {
              if (
                requestId ===
                  resolveRequestIdRef.current
              ) {
                setIsResolving(
                  false
                );
              }
            }
          },
          150
        );


      return () => {
        window.clearTimeout(
          timer
        );
      };
    },
    [
      selectedResult,
      publisher,
      journal,
      artworkType,
    ]
  );


  function handleJournalInput(
    value: string
  ) {
    setJournalQuery(
      value
    );

    setJournal(
      value
    );

    if (
      selectedResult &&
      value !==
        selectedResult.journalName
    ) {
      setSelectedResult(
        null
      );
    }

    setResolvedTarget(
      null
    );

    setResolutionSources(
      []
    );

    setResolutionError(
      null
    );

    setShowResults(
      true
    );
  }


  function selectJournal(
    result:
      PublicationSearchResult
  ) {
    setSelectedResult(
      result
    );

    setJournalQuery(
      result.journalName
    );

    setJournal(
      result.journalName
    );

    setPublisher(
      result.publisherName
    );

    setSearchResults(
      []
    );

    setSearchError(
      null
    );

    setShowResults(
      false
    );

    setResolvedTarget(
      null
    );

    setResolutionSources(
      []
    );

    setResolutionError(
      null
    );
  }


  function clearPublicationSelection() {
    searchRequestIdRef.current +=
      1;

    resolveRequestIdRef.current +=
      1;

    setSelectedResult(
      null
    );

    setPublisher(
      ""
    );

    setJournal(
      ""
    );

    setJournalQuery(
      ""
    );

    setSearchResults(
      []
    );

    setSearchError(
      null
    );

    setShowResults(
      false
    );

    setIsSearching(
      false
    );

    setResolvedTarget(
      null
    );

    setResolutionSources(
      []
    );

    setResolutionError(
      null
    );

    setIsResolving(
      false
    );
  }


  function handlePublisherChange(
    value: string
  ) {
    setPublisher(
      value
    );

    if (
      selectedResult
    ) {
      setSelectedResult(
        null
      );
    }

    resolveRequestIdRef.current +=
      1;

    setResolvedTarget(
      null
    );

    setResolutionSources(
      []
    );

    setResolutionError(
      null
    );
  }


  const technicalProfile =
    resolvedTarget
      ?.technicalProfile ??
    null;

  const aiPolicy =
    resolvedTarget
      ?.aiPolicy ??
    null;

  const requiresManualPolicyConfirmation =
    resolvedTarget
      ?.requiresManualPolicyCheck ===
    true;

  const policyHardBlocked =
    aiPolicy?.status ===
    "not-allowed";


  return (
    <section className="max-w-3xl">
      <p className="text-sm font-medium text-cyan-300">
        STEP 2 OF 5
      </p>

      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        Where is your artwork
        going?
      </h1>

      <p className="mt-4 max-w-2xl leading-7 text-slate-400">
        Search for your target
        journal and choose the
        artwork type. CoverLab will
        then resolve the applicable
        technical requirements and
        AI-image policy independently.
      </p>


      <div className="mt-10 space-y-7">
        {/* Journal search */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Journal
          </label>

          <div className="relative">
            <input
              value={
                journalQuery
              }
              onChange={(
                event
              ) =>
                handleJournalInput(
                  event.target
                    .value
                )
              }
              onFocus={() =>
                setShowResults(
                  true
                )
              }
              autoComplete="off"
              placeholder="Search journals, e.g. Langmuir, ACS Nano, Nature..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 pr-24 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
            />

            {isSearching && (
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                <span className="text-xs text-slate-500">
                  Searching…
                </span>
              </div>
            )}


            {showResults &&
              journalQuery
                .trim()
                .length >=
                2 &&
              !selectedResult &&
              (
                searchResults.length >
                  0 ||
                searchError
              ) && (
                <div className="absolute z-30 mt-2 max-h-80 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0d121c] p-2 shadow-2xl shadow-black/40">
                  {searchError ? (
                    <div className="px-3 py-3 text-sm leading-6 text-rose-300">
                      {
                        searchError
                      }
                    </div>
                  ) : (
                    searchResults.map(
                      (
                        result
                      ) => (
                        <button
                          key={
                            result.journalId
                          }
                          type="button"
                          onClick={() =>
                            selectJournal(
                              result
                            )
                          }
                          className="flex w-full items-start justify-between gap-4 rounded-lg px-3 py-3 text-left transition hover:bg-white/[0.06]"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-slate-100">
                              {
                                result.journalName
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                result.publisherName
                              }
                            </p>

                            {result
                              .disciplines
                              .length >
                              0 && (
                              <p className="mt-1 line-clamp-1 text-xs text-slate-600">
                                {result.disciplines.join(
                                  " · "
                                )}
                              </p>
                            )}
                          </div>

                          <div className="shrink-0">
                            {result.hasVerifiedProfiles ? (
                              <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                                Coverage
                                available
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                                Manual
                                check
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    )
                  )}
                </div>
              )}
          </div>

          <p className="mt-2 text-xs leading-5 text-slate-500">
            You may manually enter a
            publication that is not
            yet indexed. CoverLab will
            not label manually entered
            requirements as verified.
          </p>
        </div>


        {/* Selected publication */}

        {selectedResult && (
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] p-5">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-cyan-300">
                  Selected
                  publication
                </p>

                <p className="mt-2 text-lg font-medium text-white">
                  {
                    selectedResult.journalName
                  }
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {
                    selectedResult.publisherName
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={
                  clearPublicationSelection
                }
                className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-400 transition hover:bg-white/5 hover:text-white"
              >
                Change
              </button>
            </div>
          </div>
        )}


        {/* Publisher */}

        <div>
          <label className="mb-2 block text-sm font-medium">
            Publisher
          </label>

          <input
            value={
              publisher
            }
            onChange={(
              event
            ) =>
              handlePublisherChange(
                event.target
                  .value
              )
            }
            placeholder="Publisher is filled automatically when a journal is selected"
            className="w-full rounded-xl border border-white/10 bg-[#0d121c] px-4 py-4 outline-none transition placeholder:text-slate-600 focus:border-cyan-400/60"
          />
        </div>


        {/* Artwork type */}

        <div>
          <label className="mb-3 block text-sm font-medium">
            Publication artwork
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            {ARTWORK_TYPES.map(
              (option) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  onClick={() =>
                    setArtworkType(
                      option.value
                    )
                  }
                  className={`rounded-xl border p-5 text-left transition ${
                    artworkType ===
                    option.value
                      ? "border-cyan-400 bg-cyan-400/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                  }`}
                >
                  <span className="block font-medium">
                    {option.label}
                  </span>

                  <span className="mt-2 block text-sm leading-6 text-slate-400">
                    {option.description}
                  </span>
                </button>
              )
            )}
          </div>
        </div>


        {/* Resolver loading */}

        {publisher.trim() &&
          journal.trim() &&
          artworkType &&
          isResolving && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm text-slate-300">
                Checking publication
                requirements and AI
                policy…
              </p>
            </div>
          )}


        {/* Resolver error */}

        {resolutionError && (
          <div className="rounded-xl border border-rose-400/20 bg-rose-400/[0.06] p-5">
            <p className="text-sm font-medium text-rose-300">
              Publication check
              unavailable
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              {
                resolutionError
              }
            </p>
          </div>
        )}


        {/* Resolved publication rules */}

        {resolvedTarget &&
          !isResolving && (
            <div className="space-y-4">
              {/* Technical requirements */}

              <div
                className={`rounded-xl border p-5 ${
                  resolvedTarget.requiresManualTechnicalCheck
                    ? "border-amber-400/20 bg-amber-400/[0.05]"
                    : "border-emerald-400/20 bg-emerald-400/[0.05]"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Technical
                      requirements
                    </p>

                    <p
                      className={`mt-2 text-base font-medium ${
                        resolvedTarget.requiresManualTechnicalCheck
                          ? "text-amber-300"
                          : "text-emerald-300"
                      }`}
                    >
                      {resolvedTarget.requiresManualTechnicalCheck
                        ? "Manual verification required"
                        : resolvedTarget.technicalOrigin ===
                            "journal"
                          ? "Verified journal requirements"
                          : "Verified publisher-level guidance"}
                    </p>
                  </div>

                  <OriginBadge
                    origin={
                      resolvedTarget.technicalOrigin
                    }
                  />
                </div>


                {technicalProfile ? (
                  <div className="mt-5 space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <RequirementItem
                        label="Dimensions"
                        value={
                          formatDimensions(
                            technicalProfile
                          )
                        }
                      />

                      <RequirementItem
                        label="Resolution"
                        value={
                          formatResolution(
                            technicalProfile
                          )
                        }
                      />

                      <RequirementItem
                        label="Formats"
                        value={
                          formatFormats(
                            technicalProfile
                          )
                        }
                      />

                      <RequirementItem
                        label="Verified"
                        value={
                          technicalProfile
                            .provenance
                            .verifiedOn
                        }
                      />
                    </div>


                    {technicalProfile
                      .safeAreas
                      ?.mastheadArea && (
                      <div className="rounded-lg border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Safe area /
                          masthead
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {formatMastheadArea(
                            technicalProfile
                          )}
                        </p>
                      </div>
                    )}


                    {technicalProfile
                      .notes &&
                      technicalProfile
                        .notes
                        .length >
                        0 && (
                        <ul className="space-y-1 text-xs leading-5 text-slate-500">
                          {technicalProfile.notes.map(
                            (
                              note
                            ) => (
                              <li
                                key={
                                  note
                                }
                              >
                                •{" "}
                                {
                                  note
                                }
                              </li>
                            )
                          )}
                        </ul>
                      )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    No verified
                    technical profile
                    currently matches
                    this exact
                    publication and
                    artwork type.
                    CoverLab will not
                    invent dimensions,
                    DPI or format
                    requirements.
                  </p>
                )}
              </div>


              {/* AI policy */}

              <div
                className={`rounded-xl border p-5 ${policyPanelClasses(
                  aiPolicy?.status ??
                    "manual-check"
                )}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      Generative AI
                      policy
                    </p>

                    <p
                      className={`mt-2 text-base font-medium ${policyTextClasses(
                        aiPolicy?.status ??
                          "manual-check"
                      )}`}
                    >
                      {policyLabel(
                        aiPolicy?.status ??
                          "manual-check"
                      )}
                    </p>
                  </div>

                  <OriginBadge
                    origin={
                      resolvedTarget.policyOrigin
                    }
                  />
                </div>


                {aiPolicy ? (
                  <>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {
                        aiPolicy.message
                      }
                    </p>


                    {aiPolicy
                      .disclosure
                      .required ===
                      true && (
                      <div className="mt-4 rounded-lg border border-white/10 bg-black/10 px-4 py-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                          Disclosure
                          required
                        </p>

                        {aiPolicy
                          .disclosure
                          .instructions && (
                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {
                              aiPolicy
                                .disclosure
                                .instructions
                            }
                          </p>
                        )}
                      </div>
                    )}


                    {aiPolicy.conditions &&
                      aiPolicy
                        .conditions
                        .length >
                        0 && (
                        <div className="mt-4">
                          <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                            Conditions
                          </p>

                          <ul className="mt-2 space-y-1 text-sm leading-6 text-slate-400">
                            {aiPolicy.conditions.map(
                              (
                                condition
                              ) => (
                                <li
                                  key={
                                    condition
                                  }
                                >
                                  •{" "}
                                  {
                                    condition
                                  }
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}


                    {resolvedTarget.requiresManualPolicyCheck && (
                      <label
                        className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                          manualPolicyConfirmed
                            ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                            : "border-amber-300/20 bg-amber-300/[0.04]"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={
                            manualPolicyConfirmed
                          }
                          onChange={(
                            event
                          ) =>
                            setManualPolicyConfirmed(
                              event.target
                                .checked
                            )
                          }
                          className="mt-1"
                        />

                        <span>
                          <span className="block text-sm font-medium text-slate-200">
                            Author verification
                          </span>

                          <span className="mt-1 block text-sm leading-6 text-slate-400">
                            I have reviewed the
                            applicable publisher
                            and journal
                            requirements and
                            confirm that I am
                            responsible for
                            determining whether
                            this AI-assisted
                            workflow is permitted
                            for my submission.
                          </span>
                        </span>
                      </label>
                    )}


                    <p className="mt-4 text-xs text-slate-500">
                      Verified{" "}
                      {
                        aiPolicy
                          .provenance
                          .verifiedOn
                      }
                    </p>
                  </>
                ) : (
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    No verified AI
                    policy currently
                    matches this
                    publication and
                    artwork type.
                    Manual verification
                    is required before
                    relying on
                    generative AI.
                  </p>
                )}

                {!aiPolicy &&
                  resolvedTarget.requiresManualPolicyCheck && (
                  <label
                    className={`mt-5 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                      manualPolicyConfirmed
                        ? "border-emerald-400/30 bg-emerald-400/[0.05]"
                        : "border-amber-300/20 bg-amber-300/[0.04]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={
                        manualPolicyConfirmed
                      }
                      onChange={(
                        event
                      ) =>
                        setManualPolicyConfirmed(
                          event.target
                            .checked
                        )
                      }
                      className="mt-1"
                    />

                    <span>
                      <span className="block text-sm font-medium text-slate-200">
                        Author verification
                      </span>

                      <span className="mt-1 block text-sm leading-6 text-slate-400">
                        I have reviewed the
                        applicable publisher
                        and journal
                        requirements and
                        confirm that I am
                        responsible for
                        determining whether
                        this AI-assisted
                        workflow is permitted
                        for my submission.
                      </span>
                    </span>
                  </label>
                )}
              </div>


              {/* Official sources */}

              {resolutionSources.length >
                0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Official sources
                  </p>

                  <div className="mt-3 space-y-3">
                    {resolutionSources.map(
                      (
                        source
                      ) => (
                        <div
                          key={
                            source.id
                          }
                          className="rounded-lg border border-white/[0.07] bg-black/10 px-4 py-3"
                        >
                          <a
                            href={
                              source.url
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-cyan-300 underline decoration-cyan-400/30 underline-offset-4 transition hover:text-cyan-200"
                          >
                            {
                              source.title
                            }
                          </a>

                          <p className="mt-1 text-xs text-slate-500">
                            Checked by
                            CoverLab:{" "}
                            {
                              source.accessedOn
                            }
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}


              {/* Warnings */}

              {resolvedTarget
                .warnings
                .length >
                0 && (
                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-5">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                    Publication notes
                  </p>

                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-400">
                    {resolvedTarget.warnings.map(
                      (
                        warning
                      ) => (
                        <li
                          key={
                            warning
                          }
                        >
                          •{" "}
                          {
                            warning
                          }
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}


        {/* Manual-entry notice */}

        {!selectedResult &&
          publisher.trim() &&
          journal.trim() && (
            <div className="rounded-xl border border-amber-400/15 bg-amber-400/[0.05] p-5">
              <p className="text-sm font-medium text-amber-300">
                Manually entered
                publication
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                This publication was
                entered manually.
                CoverLab will resolve
                the typed names against
                available registry data
                where possible. Any
                unresolved technical
                requirement or AI
                policy remains a manual
                check, and publication
                export still requires a
                verified exact profile.
              </p>
            </div>
          )}


        {/* Navigation */}

        <div className="flex items-center justify-between pt-4">
          <button
            type="button"
            onClick={
              onBack
            }
            className="rounded-full border border-white/10 px-6 py-3.5 text-sm transition hover:bg-white/5"
          >
            ← Back
          </button>

          <button
            type="button"
            onClick={
              onContinue
            }
            disabled={
              !publisher.trim() ||
              !journal.trim() ||
              !artworkType ||
              isResolving ||
              !resolvedTarget ||
              Boolean(
                resolutionError
              ) ||
              policyHardBlocked ||
              (
                requiresManualPolicyConfirmation &&
                !manualPolicyConfirmed
              )
            }
            className="rounded-full bg-white px-7 py-3.5 font-medium text-black transition enabled:hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Continue to assets →
          </button>
        </div>
      </div>
    </section>
  );
}


/* =========================================================
   Small UI helpers
   ========================================================= */

function RequirementItem({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/10 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-sm leading-6 text-slate-200">
        {value}
      </p>
    </div>
  );
}


function OriginBadge({
  origin,
}: {
  origin:
    ResolutionOrigin;
}) {
  const label =
    origin ===
    "journal"
      ? "Journal level"
      : origin ===
          "publisher"
        ? "Publisher level"
        : origin ===
            "manual"
          ? "Manual"
          : "Unresolved";

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-slate-400">
      {label}
    </span>
  );
}


/* =========================================================
   Formatting helpers
   ========================================================= */

function formatDimensions(
  profile:
    TechnicalProfile
) {
  const dimensions =
    profile.dimensions;

  if (
    dimensions
  ) {
    if (
      dimensions.mode ===
        "exact" &&
      dimensions.widthPx &&
      dimensions.heightPx
    ) {
      return `${dimensions.widthPx} × ${dimensions.heightPx} px`;
    }

    if (
      dimensions.mode ===
        "minimum" &&
      dimensions.minimumWidthPx &&
      dimensions.minimumHeightPx
    ) {
      return `Minimum ${dimensions.minimumWidthPx} × ${dimensions.minimumHeightPx} px`;
    }

    if (
      dimensions.mode ===
        "maximum" &&
      dimensions.maximumWidthPx &&
      dimensions.maximumHeightPx
    ) {
      return `Maximum ${dimensions.maximumWidthPx} × ${dimensions.maximumHeightPx} px`;
    }
  }


  if (
    profile.physicalDimensions
  ) {
    const physical =
      profile.physicalDimensions;

    if (
      physical.width &&
      physical.height
    ) {
      return `${physical.width} × ${physical.height} ${physical.unit}`;
    }
  }


  return "See official publication guidance";
}


function formatResolution(
  profile:
    TechnicalProfile
) {
  const rules =
    profile.resolution ??
    [];

  if (
    rules.length ===
    0
  ) {
    return "Not specified";
  }

  return rules
    .map(
      (rule) => {
        if (
          rule.dpi
        ) {
          if (
            rule.mode ===
            "minimum"
          ) {
            return `Minimum ${rule.dpi} dpi`;
          }

          return `${rule.dpi} dpi`;
        }

        if (
          rule.mode ===
          "minimum"
        ) {
          return `Minimum ${rule.dpi} dpi`;
        }

        return rule.mode;
      }
    )
    .join(
      " · "
    );
}


function formatFormats(
  profile:
    TechnicalProfile
) {
  const formats =
    (
      profile.formats ??
      []
    ).filter(
      (format) =>
        format.allowed
    );

  if (
    formats.length ===
    0
  ) {
    return "Not specified";
  }

  return formats
    .map(
      (format) =>
        format.preferred
          ? `${format.format} (preferred)`
          : format.format
    )
    .join(
      ", "
    );
}


function formatMastheadArea(
  profile:
    TechnicalProfile
) {
  const safeAreas =
    profile.safeAreas;

  const masthead =
    safeAreas
      ?.mastheadArea;

  if (
    !safeAreas ||
    !masthead
  ) {
    return "See official publication guidance";
  }

  const values: string[] =
    [];

  if (
    masthead.top !==
    undefined
  ) {
    values.push(
      `Top ${masthead.top} ${safeAreas.unit}`
    );
  }

  if (
    masthead.right !==
    undefined
  ) {
    values.push(
      `Right ${masthead.right} ${safeAreas.unit}`
    );
  }

  if (
    masthead.bottom !==
    undefined
  ) {
    values.push(
      `Bottom ${masthead.bottom} ${safeAreas.unit}`
    );
  }

  if (
    masthead.left !==
    undefined
  ) {
    values.push(
      `Left ${masthead.left} ${safeAreas.unit}`
    );
  }

  return values.length >
    0
    ? values.join(
        " · "
      )
    : "See official publication guidance";
}


/* =========================================================
   Policy presentation
   ========================================================= */

function policyLabel(
  status:
    AiPolicyStatus
) {
  switch (
    status
  ) {
    case "allowed":
      return "AI use allowed";

    case "conditional":
      return "AI use conditional";

    case "not-allowed":
      return "Generative AI not permitted";

    case "manual-check":
    default:
      return "Manual policy check required";
  }
}


function policyPanelClasses(
  status:
    AiPolicyStatus
) {
  switch (
    status
  ) {
    case "allowed":
      return "border-emerald-400/20 bg-emerald-400/[0.05]";

    case "conditional":
      return "border-amber-400/20 bg-amber-400/[0.05]";

    case "not-allowed":
      return "border-rose-400/25 bg-rose-400/[0.07]";

    case "manual-check":
    default:
      return "border-amber-400/20 bg-amber-400/[0.05]";
  }
}


function policyTextClasses(
  status:
    AiPolicyStatus
) {
  switch (
    status
  ) {
    case "allowed":
      return "text-emerald-300";

    case "conditional":
      return "text-amber-300";

    case "not-allowed":
      return "text-rose-300";

    case "manual-check":
    default:
      return "text-amber-300";
  }
}


/* =========================================================
   Response safety helpers
   ========================================================= */

async function readJsonResponse(
  response: Response
): Promise<unknown> {
  const text =
    await response.text();

  if (
    !text
  ) {
    return null;
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    throw new Error(
      `The server returned an invalid response. HTTP ${response.status}.`
    );
  }
}


function getApiError(
  data: unknown,
  fallback: string
) {
  if (
    typeof data ===
      "object" &&
    data !==
      null &&
    "error" in data &&
    typeof (
      data as {
        error?: unknown;
      }
    ).error ===
      "string"
  ) {
    return (
      data as {
        error: string;
      }
    ).error;
  }

  return fallback;
}


function isSearchResponse(
  data: unknown
): data is PublicationSearchResponse {
  if (
    typeof data !==
      "object" ||
    data ===
      null
  ) {
    return false;
  }

  const candidate =
    data as {
      results?: unknown;
    };

  return Array.isArray(
    candidate.results
  );
}


function isResolveResponse(
  data: unknown
): data is ResolveResponse {
  if (
    typeof data !==
      "object" ||
    data ===
      null
  ) {
    return false;
  }

  const candidate =
    data as {
      resolved?: unknown;

      sources?: unknown;
    };

  return (
    typeof candidate.resolved ===
      "object" &&
    candidate.resolved !==
      null &&
    Array.isArray(
      candidate.sources
    )
  );
}
