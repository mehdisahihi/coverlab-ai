import type {
  JournalRecord,
  PublicationSearchResult,
  PublisherRecord,
} from "./types";

import {
  JOURNALS,
} from "./journals";

import {
  PUBLISHERS,
} from "./publishers";

import {
  normalizePublicationText,
} from "./artworkTypes";

import {
  PUBLICATION_PROFILES,
} from "./profiles";

/*
 * CoverLab AI
 * Publication Registry V2
 *
 * Journal / publication search engine.
 *
 * Search currently works entirely in memory.
 *
 * This is intentional:
 *
 * - simple,
 * - deterministic,
 * - easy to test,
 * - no database dependency yet.
 *
 * Later, the same public API can be backed by
 * PostgreSQL / full-text search / external
 * journal metadata without forcing the UI to
 * change.
 */


/* =========================================================
   Types
   ========================================================= */

export type PublicationSearchOptions = {
  publisherId?: string;

  discipline?: string;

  limit?: number;

  includeInactive?: boolean;
};

type ScoredJournalResult = {
  journal: JournalRecord;

  publisher: PublisherRecord;

  score: number;

  matchedAlias?: string;
};


/* =========================================================
   Helpers
   ========================================================= */

function uniqueWords(
  value: string
) {
  return Array.from(
    new Set(
      normalizePublicationText(
        value
      )
        .split(" ")
        .filter(Boolean)
    )
  );
}


function startsWithQuery(
  value: string,
  query: string
) {
  return normalizePublicationText(
    value
  ).startsWith(
    query
  );
}


function includesQuery(
  value: string,
  query: string
) {
  return normalizePublicationText(
    value
  ).includes(
    query
  );
}


function allQueryWordsPresent(
  value: string,
  queryWords: string[]
) {
  const normalized =
    normalizePublicationText(
      value
    );

  return queryWords.every(
    (word) =>
      normalized.includes(
        word
      )
  );
}


function getPublisherForJournal(
  journal: JournalRecord
) {
  return (
    PUBLISHERS.find(
      (publisher) =>
        publisher.id ===
        journal.publisherId
    ) ?? null
  );
}


/* =========================================================
   Scoring
   ========================================================= */

/*
 * Search priority:
 *
 * 1. exact journal name
 * 2. exact journal alias
 * 3. journal name begins with query
 * 4. alias begins with query
 * 5. journal name contains query
 * 6. alias contains query
 * 7. all query words occur in journal name
 * 8. publisher name / alias
 * 9. discipline
 *
 * The absolute score itself is not important.
 * Relative ordering is.
 */

function scoreJournal(
  journal: JournalRecord,
  publisher: PublisherRecord,
  query: string
): {
  score: number;
  matchedAlias?: string;
} {
  const normalizedName =
    normalizePublicationText(
      journal.name
    );

  const normalizedAliases =
    journal.aliases.map(
      (alias) => ({
        original:
          alias,

        normalized:
          normalizePublicationText(
            alias
          ),
      })
    );

  const queryWords =
    uniqueWords(
      query
    );

  /*
   * Exact journal name.
   */

  if (
    normalizedName ===
    query
  ) {
    return {
      score: 1000,
    };
  }

  /*
   * Exact journal alias.
   */

  const exactAlias =
    normalizedAliases.find(
      (alias) =>
        alias.normalized ===
        query
    );

  if (
    exactAlias
  ) {
    return {
      score: 950,

      matchedAlias:
        exactAlias.original,
    };
  }

  let score = 0;

  let matchedAlias:
    | string
    | undefined;


  /*
   * Journal name starts with query.
   */

  if (
    startsWithQuery(
      journal.name,
      query
    )
  ) {
    score = Math.max(
      score,
      850
    );
  }


  /*
   * Alias starts with query.
   */

  const startingAlias =
    normalizedAliases.find(
      (alias) =>
        alias.normalized.startsWith(
          query
        )
    );

  if (
    startingAlias
  ) {
    score = Math.max(
      score,
      800
    );

    matchedAlias =
      startingAlias.original;
  }


  /*
   * Journal name contains query.
   */

  if (
    includesQuery(
      journal.name,
      query
    )
  ) {
    score = Math.max(
      score,
      700
    );
  }


  /*
   * Alias contains query.
   */

  const containingAlias =
    normalizedAliases.find(
      (alias) =>
        alias.normalized.includes(
          query
        )
    );

  if (
    containingAlias
  ) {
    score = Math.max(
      score,
      650
    );

    matchedAlias =
      matchedAlias ??
      containingAlias.original;
  }


  /*
   * All query words occur somewhere
   * in the journal name.
   */

  if (
    queryWords.length > 1 &&
    allQueryWordsPresent(
      journal.name,
      queryWords
    )
  ) {
    score = Math.max(
      score,
      600
    );
  }


  /*
   * Publisher matching.
   */

  const publisherNames = [
    publisher.name,
    ...publisher.aliases,
  ];

  if (
    publisherNames.some(
      (name) =>
        normalizePublicationText(
          name
        ) === query
    )
  ) {
    score = Math.max(
      score,
      500
    );
  } else if (
    publisherNames.some(
      (name) =>
        includesQuery(
          name,
          query
        )
    )
  ) {
    score = Math.max(
      score,
      450
    );
  }


  /*
   * Discipline matching.
   */

  const disciplines =
    journal.disciplines ?? [];

  if (
    disciplines.some(
      (discipline) =>
        normalizePublicationText(
          discipline
        ) === query
    )
  ) {
    score = Math.max(
      score,
      400
    );
  } else if (
    disciplines.some(
      (discipline) =>
        includesQuery(
          discipline,
          query
        )
    )
  ) {
    score = Math.max(
      score,
      350
    );
  }


  /*
   * Weak multi-word search across a combined
   * searchable representation.
   */

  const searchableText =
    [
      journal.name,

      ...journal.aliases,

      publisher.name,

      ...publisher.aliases,

      ...disciplines,
    ].join(
      " "
    );

  if (
    queryWords.length > 1 &&
    allQueryWordsPresent(
      searchableText,
      queryWords
    )
  ) {
    score = Math.max(
      score,
      300
    );
  }


  return {
    score,
    matchedAlias,
  };
}

function journalHasVerifiedProfile(
  journal: JournalRecord
) {
  const journalSpecific =
    PUBLICATION_PROFILES.some(
      (profile) =>
        profile.version.active &&
        profile.journalId ===
          journal.id &&
        profile.provenance
          .verificationStatus ===
          "verified"
    );

  if (
    journalSpecific
  ) {
    return true;
  }

  return PUBLICATION_PROFILES.some(
    (profile) =>
      profile.version.active &&
      !profile.journalId &&
      profile.publisherId ===
        journal.publisherId &&
      profile.provenance
        .verificationStatus ===
        "verified"
  );
}

/* =========================================================
   Main search
   ========================================================= */

export function searchPublications(
  rawQuery: string,
  options: PublicationSearchOptions = {}
): PublicationSearchResult[] {
  const query =
    normalizePublicationText(
      rawQuery
    );

  const {
    publisherId,

    discipline,

    limit = 20,

    includeInactive = false,
  } = options;

  const normalizedDiscipline =
    discipline
      ? normalizePublicationText(
          discipline
        )
      : null;


  /*
   * Empty search is useful in the UI:
   *
   * for example after selecting a publisher,
   * we can show journals belonging to it.
   */

  if (
  !query
) {
  const results: PublicationSearchResult[] =
    [];

  for (
    const journal of
    JOURNALS
  ) {
    if (
      !includeInactive &&
      !journal.active
    ) {
      continue;
    }

    if (
      publisherId &&
      journal.publisherId !==
        publisherId
    ) {
      continue;
    }

    if (
      normalizedDiscipline
    ) {
      const matchesDiscipline =
        (
          journal.disciplines ??
          []
        ).some(
          (item) =>
            normalizePublicationText(
              item
            ).includes(
              normalizedDiscipline
            )
        );

      if (
        !matchesDiscipline
      ) {
        continue;
      }
    }

    const publisher =
      getPublisherForJournal(
        journal
      );

    if (
      !publisher
    ) {
      /*
       * Broken registry relationship.
       *
       * Never expose an orphan journal
       * to the search UI.
       */

      continue;
    }

    if (
      !includeInactive &&
      !publisher.active
    ) {
      continue;
    }

    results.push({
      journalId:
        journal.id,

      journalName:
        journal.name,

      publisherId:
        publisher.id,

      publisherName:
        publisher.name,

      disciplines:
        journal.disciplines ??
        [],

      /*
       * Identity in the journal database
       * does NOT mean CoverLab has verified
       * publication requirements for it.
       *
       * profiles.ts will make this dynamic
       * later.
       */

      hasVerifiedProfiles:
        journalHasVerifiedProfile(
          journal
        ),
    });
  }

  return results
    .sort(
      (a, b) =>
        a.journalName.localeCompare(
          b.journalName
        )
    )
    .slice(
      0,
      Math.max(
        0,
        limit
      )
    );
}


  const scored: ScoredJournalResult[] =
    [];


  for (
    const journal of
    JOURNALS
  ) {
    if (
      !includeInactive &&
      !journal.active
    ) {
      continue;
    }

    if (
      publisherId &&
      journal.publisherId !==
        publisherId
    ) {
      continue;
    }

    if (
      normalizedDiscipline
    ) {
      const matchesDiscipline =
        (
          journal.disciplines ??
          []
        ).some(
          (item) =>
            normalizePublicationText(
              item
            ).includes(
              normalizedDiscipline
            )
        );

      if (
        !matchesDiscipline
      ) {
        continue;
      }
    }

    const publisher =
      getPublisherForJournal(
        journal
      );

    if (
      !publisher
    ) {
      /*
       * Broken registry relationship.
       *
       * Do not expose an orphan journal
       * to the search UI.
       */

      continue;
    }

    if (
      !includeInactive &&
      !publisher.active
    ) {
      continue;
    }

    const result =
      scoreJournal(
        journal,
        publisher,
        query
      );

    if (
      result.score <= 0
    ) {
      continue;
    }

    scored.push({
      journal,

      publisher,

      score:
        result.score,

      matchedAlias:
        result.matchedAlias,
    });
  }


  scored.sort(
    (a, b) => {
      if (
        b.score !==
        a.score
      ) {
        return (
          b.score -
          a.score
        );
      }

      return a.journal.name.localeCompare(
        b.journal.name
      );
    }
  );


  return scored
    .slice(
      0,
      Math.max(
        0,
        limit
      )
    )
    .map(
      ({
        journal,
        publisher,
        matchedAlias,
      }) => ({
        journalId:
          journal.id,

        journalName:
          journal.name,

        publisherId:
          publisher.id,

        publisherName:
          publisher.name,

        matchedAlias,

        disciplines:
          journal.disciplines ??
          [],

        /*
         * This becomes dynamic once
         * profiles.ts exists.
         *
         * We deliberately return false
         * rather than pretending that an
         * identity record is a verified
         * publication profile.
         */

        hasVerifiedProfiles:
          journalHasVerifiedProfile(
             journal
          ),
      })
    );
}


/* =========================================================
   Exact identity resolution
   ========================================================= */

/*
 * Search and exact resolution are different.
 *
 * The resolver should NEVER select a journal
 * merely because it was the "closest" fuzzy
 * search result.
 */

export function findJournalByNameOrAlias(
  value: string,
  publisherId?: string
): JournalRecord | null {
  const normalized =
    normalizePublicationText(
      value
    );

  if (
    !normalized
  ) {
    return null;
  }

  return (
    JOURNALS.find(
      (journal) => {
        if (
          publisherId &&
          journal.publisherId !==
            publisherId
        ) {
          return false;
        }

        if (
          normalizePublicationText(
            journal.name
          ) === normalized
        ) {
          return true;
        }

        return journal.aliases.some(
          (alias) =>
            normalizePublicationText(
              alias
            ) === normalized
        );
      }
    ) ?? null
  );
}


export function findPublisherByNameOrAlias(
  value: string
): PublisherRecord | null {
  const normalized =
    normalizePublicationText(
      value
    );

  if (
    !normalized
  ) {
    return null;
  }

  return (
    PUBLISHERS.find(
      (publisher) => {
        if (
          normalizePublicationText(
            publisher.name
          ) === normalized
        ) {
          return true;
        }

        return publisher.aliases.some(
          (alias) =>
            normalizePublicationText(
              alias
            ) === normalized
        );
      }
    ) ?? null
  );
}