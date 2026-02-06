# Skill: Deep Research
When the user asks about a software library, API or concept, follow these steps:
1. Call `context7.resolve_id` with the library name to obtain its internal identifier.
2. Call `context7.get_docs` with that identifier and relevant sections or functions requested to retrieve canonical documentation snippets.
3. Call `google-drive.search` with the library name and related keywords to find any internal design documents or meeting notes.  Summarise the most relevant results and their URLs.
4. Synthesize a comprehensive answer combining official docs and internal knowledge.  Clearly delineate which parts come from official sources and which come from internal documents.
5. Call `notion.create_page` to create a page under a "Research Notes" database in your workspace, containing the summary and links.  Use a clear title based on the library name and date.