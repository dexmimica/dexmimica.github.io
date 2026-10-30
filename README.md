# DexMimica

This checkout presents **DexMimica: Mixed-Autonomy Data Collection for Dexterous
Manipulation**, using `DexMimica-ICRA2027/root.tex` and its standalone figure
PDFs. The project address is `https://dexmimica.github.io/`.

The project homepage is `index.html`, using the shared `project-website-template`.
Open it directly in a browser. Content previews need no build or local server;
run `node build-index.mjs` before publishing to refresh social metadata.

## Files

- `index.html`: the selected page layout.
- `content.js`: editable paper content, links, media, and theme colors.
- `styles.css`: the single stylesheet, including responsive and print styles.
- `render-content.js` and `project.js`: render the content and handle navigation
  and video playback.
- `build-index.mjs`: updates metadata and validates sections and local media.
- `template-version.json`: installed template version and managed-file fingerprints.
- `assets/`: paper figures, PDF originals, result videos and their posters,
  favicon, and the local Inter font with its license.

## Paper content and figures

The title, anonymous author credit, abstract, and figure captions follow
`root.tex`. The method and results prose summarizes the paper.
The abstract's project-website footnote is omitted on this project page.
Resource links remain disabled until their arXiv and code URLs are supplied.

The supplied `root.pdf` contains the original IEEE sample document, so it is
not used as a manuscript or content source. The standalone figure PDFs match
the figures referenced by `root.tex`.

| Page content | Paper source |
| --- | --- |
| Teaser, Figure 1 | `dexmimica-teaser-v2.pdf` |
| Method overview, Figure 2 | `dexmimica-method-v2.pdf` |
| Qualitative generalization, Figure 4 | `dexmimica-qualitative-v2.pdf` |
| Quantitative teleoperation results | Inline `tab:main_results` in `root.tex` |
| Index-finger spin videos | `assets/2x-3x1cube-index.mp4`, `assets/2x-4x1cube-index.mp4` |

PDF figures are rendered as PNGs, with their original PDFs retained in `assets/`.
Teaser and method images are 2400 pixels wide, and the qualitative figure is
1600 pixels wide. All preserve
the source aspect ratios. The dimensions in `content.js` match these web copies.
Both MP4s are H.264 at 960 × 540. They use their existing JPG posters, native
playback controls, and the speed already encoded in the files. Videos are
prepared near the viewport; playback begins on Play, one clip at a time.

## Edit content

Edit `content.js`, save, and refresh the page. Text is plain text, not HTML.
Each entry in a `paragraphs` array becomes a separate paragraph.

| Field | Content |
| --- | --- |
| `paper.name`, `paper.title`, `paper.description` | Project name, title, and description. |
| `paper.socialImage` | Teaser image used in social metadata. |
| `paper.authors` | Names, optional website links, and affiliation IDs. |
| `paper.affiliations` | Institution names and IDs referenced by authors. |
| `paper.links` | Resource labels and URLs; empty URLs show disabled placeholders. |
| `paper.authorNotes` | Contribution note; an empty string hides it. |
| `sectionOrder` | Ordered section IDs; each names a record below. |
| Section `navTitle` | Include this section in the sidebar; omit to hide its link. |
| `abstract` | Section title and paragraphs. |
| `teaser` | Mixed-autonomy teleoperation figure and caption. |
| `method` | Method figure, caption, and explanations. |
| `results` | Experimental setup and result videos. |
| `generalization` | Qualitative results across cube variations. |
| `media` | This site uses `autoplay: false`, `pauseOthers: true`. |

Put new media in `assets/` and update its relative path and actual dimensions
in `content.js`. Use ordered `blocks` to control text and figure placement.
Keep the surrounding quotes and commas when editing;
`node --check content.js` checks JavaScript syntax.

## Appearance

The page uses Inter with a 660px reading column and a compact sidebar.
Body text is 15px at weight 350, with 21px line spacing and no added letter
spacing. Section spacing and heading styles follow the shared template. Navigation
moves above the article on smaller screens, and videos stack on phones.

The `theme` object in `content.js` controls `accent` and `text` colors.
Supporting colors derive from them. `tintBackground` enables an accent tint;
`backgroundTintPercent` controls its strength from 0 (white) to 100.
Make typography and layout changes in the template repository, then run the
updater to bring them here. Project-specific colors stay in `content.js`.

Inter is bundled under the [SIL Open Font License](assets/fonts/OFL.txt).

## Optional HTTP preview

Run `python3 -m http.server 8000` in this directory, then open
<http://localhost:8000/>.

## Shared template updates

The installed release is recorded in `template-version.json`. Use a checkout of
the desired template release to update this project:

```sh
node ../../project-website-template/scripts/update-project.mjs . --dry-run
node ../../project-website-template/scripts/update-project.mjs .
node ../../project-website-template/scripts/update-project.mjs . --check
```

The updater preserves `content.js`, project media, and this README. It stops if
shared files were edited locally. Changes to shared styles or behavior belong
in the template repository. Before publishing content changes, run
`node build-index.mjs` followed by `node build-index.mjs --check`.
