"use client";

import { useMutation, useQuery } from "convex/react";
import { useCachedStableQuery, useStableQuery } from "./searchHooks";
import { api } from "../convex/_generated/api";
import { useState } from "react";

interface Message {
  _id: string;
  title: string;
  text: string;
}

function SendMessageForm() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const sendMessage = useMutation(api.messages.send);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    await sendMessage({
      author: title,
      body: text,
    });

    // Clear form
    setTitle("");
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-2 p-4 rounded-md border-2 border-slate-200 dark:border-slate-800"
    >
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="px-4 py-2 rounded-md border-2 border-slate-200 dark:border-slate-800 bg-light dark:bg-dark w-1/4"
        placeholder="Title..."
        required
      />
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="px-4 py-2 rounded-md border-2 border-slate-200 dark:border-slate-800 bg-light dark:bg-dark flex-1"
        placeholder="Type your message..."
        required
      />
      <button
        type="submit"
        className="bg-dark dark:bg-light text-light dark:text-dark px-4 py-2 rounded-md border-2 hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        Send
      </button>
    </form>
  );
}

type QueryVariant = "useQuery" | "useStableQuery" | "useCachedStableQuery";

interface SearchResultsProps {
  results: Message[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function SearchResults({
  results,
  selectedId,
  onSelect,
  isPrevious,
  isStale,
}: SearchResultsProps & { isPrevious?: boolean; isStale?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-6 flex items-center">
        {isPrevious && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading results...</span>
          </div>
        )}
        {isStale && !isPrevious && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Updating results...</span>
          </div>
        )}
      </div>
      {results.map((result: Message) => (
        <div
          key={result._id}
          className={`p-4 rounded-md border-2 border-slate-200 dark:border-slate-800 cursor-pointer transition-all ${
            selectedId === result._id ? "bg-slate-100 dark:bg-slate-700" : ""
          }`}
          onClick={() =>
            onSelect(selectedId === result._id ? null : result._id)
          }
        >
          <h3 className="font-bold">{result.title}</h3>
          <div
            className={`overflow-hidden transition-all duration-200 ${
              selectedId === result._id ? "max-h-96 mt-2" : "max-h-0"
            }`}
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {result.text}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface SearchContainerProps {
  query: string;
  maxResults: number;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function UseQuerySearch({
  query,
  maxResults,
  selectedId,
  onSelect,
}: SearchContainerProps) {
  const results = useQuery(api.messages.search, { query, maxResults }) ?? [];
  return (
    <SearchResults
      results={results}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}

function UseStableQuerySearch({
  query,
  maxResults,
  selectedId,
  onSelect,
}: SearchContainerProps) {
  const {
    data: results,
    isPrevious,
    isStale,
  } = useStableQuery<Message[]>(api.messages.search, { query, maxResults }) ?? {
    data: [],
    isPrevious: false,
    isStale: false,
  };
  return (
    <SearchResults
      results={results ?? []}
      selectedId={selectedId}
      onSelect={onSelect}
      isPrevious={isPrevious}
      isStale={isStale}
    />
  );
}

function UseCachedStableQuerySearch({
  query,
  maxResults,
  selectedId,
  onSelect,
}: SearchContainerProps) {
  const {
    data: results,
    isPrevious,
    isStale,
  } = useCachedStableQuery<Message[]>(api.messages.search, {
    query,
    maxResults,
  }) ?? { data: [], isPrevious: false, isStale: false };
  return (
    <SearchResults
      results={results ?? []}
      selectedId={selectedId}
      onSelect={onSelect}
      isPrevious={isPrevious}
      isStale={isStale}
    />
  );
}

function Content() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queryVariant, setQueryVariant] = useState<QueryVariant>("useQuery");
  const [maxResults, setMaxResults] = useState(10);

  const SearchComponent = {
    useQuery: UseQuerySearch,
    useStableQuery: UseStableQuerySearch,
    useCachedStableQuery: UseCachedStableQuerySearch,
  }[queryVariant];

  return (
    <div className="flex flex-col gap-8 max-w-lg mx-auto">
      <SendMessageForm />
      <div className="flex flex-col gap-4">
        <div className="flex gap-4 items-center">
          <select
            value={queryVariant}
            onChange={(e) => setQueryVariant(e.target.value as QueryVariant)}
            className="px-4 py-2 rounded-md border-2 border-slate-200 dark:border-slate-800 bg-light dark:bg-dark"
          >
            <option value="useQuery">useQuery</option>
            <option value="useStableQuery">useStableQuery</option>
            <option value="useCachedStableQuery">useCachedStableQuery</option>
          </select>
          <input
            type="number"
            value={maxResults}
            onChange={(e) => setMaxResults(Number(e.target.value))}
            min={1}
            max={100}
            className="w-24 px-4 py-2 rounded-md border-2 border-slate-200 dark:border-slate-800 bg-light dark:bg-dark"
          />
        </div>
        <input
          type="text"
          placeholder="Search messages..."
          className="w-full px-4 py-2 rounded-md border-2 border-slate-200 dark:border-slate-800 bg-light dark:bg-dark"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchComponent
          query={searchQuery}
          maxResults={maxResults}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <header className="sticky top-0 z-10 bg-light dark:bg-dark p-4 border-b-2 border-slate-200 dark:border-slate-800">
        Message Search
      </header>
      <main className="p-8 flex flex-col gap-16">
        <h1 className="text-4xl font-bold text-center">Message Search</h1>
        <Content />
      </main>
    </>
  );
}
