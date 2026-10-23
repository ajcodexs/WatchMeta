# WatchMeta advertising components

The supplied Adsterra units are registered in `src/components/adsterraUnits.js`.
Use the React wrappers instead of pasting provider scripts into `index.html`.

## Responsive banner

`AdsterraBanner` loads one banner per viewport:

- Desktop (`640px` and wider): 728x90
- Mobile (below `640px`): 320x50

It is currently placed below the player on movie and TV detail pages.

```jsx
import AdsterraBanner from '../../components/AdsterraBanner';

<AdsterraBanner />
```

You can choose another supplied banner unit for either breakpoint:

```jsx
<AdsterraBanner desktop="banner468x60" mobile="banner320x50" />
```

Available banner names:

- `banner468x60`
- `banner300x250`
- `banner160x300`
- `banner320x50`
- `banner728x90`
- `banner160x600`

The component uses `max-width: 100%` and `overflow-hidden`, so a wide unit does not create horizontal page scrolling. Only the selected breakpoint unit is loaded.

## Native banner

The native unit is available as a separate component:

```jsx
import AdsterraNative from '../../components/AdsterraNative';

<AdsterraNative />
```

Place it once in the page content where the native ad should appear. It is not loaded globally.

## Smartlink

Smartlink is intentionally a normal user-click link rather than an automatic redirect:

```jsx
import AdsterraSmartlink from '../../components/AdsterraSmartlink';

<AdsterraSmartlink>Sponsored link</AdsterraSmartlink>
```

The wrapper opens a new tab and marks the link as sponsored. Do not place Smartlink on the video player or trigger it on page load.

## Adding or changing units

1. Update the matching entry in `src/components/adsterraUnits.js`.
2. Keep provider keys out of unrelated files and do not add global scripts to `index.html`.
3. Use `npm run build` after changing a unit.
4. Test both a narrow mobile viewport and a desktop viewport to confirm only one responsive banner is loaded.

Provider scripts are third-party content and may still display their own advertisements inside the iframe. The React layer controls placement and loading timing, but cannot remove content inside a cross-origin provider frame.
