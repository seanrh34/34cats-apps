-- Resumeow no longer uses RAG: evidence is loaded deterministically
-- (active resume + profile + selected job description fit in one prompt).
drop function if exists public.match_rag_chunks(vector(1024), uuid, uuid, text, integer);
drop table if exists public.rag_chunks;
drop table if exists public.rag_documents;
