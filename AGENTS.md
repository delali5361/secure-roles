<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep local application data and mutations in the shared store so all role views stay synchronized.
- Store unsent applications separately from candidacies so drafts never enter administrator review or voting ballots.
- Keep discussion and reactions separate from votes so engagement never alters election results.
- Implement deadline and election status rules in store actions, not just dashboard buttons, to prevent early closure through alternate UI paths.
