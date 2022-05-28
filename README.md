# Play-dl


# ⚠️ Play-dl is no longer being maintained. ⚠️
## This is a repo which contains play-dl already compiled for installation. It takes the source from [AtariTom's fork](https://github.com/AtariTom/play-dl)

A **light-weight** YouTube, SoundCloud, Spotify and Deezer streaming and searching library.

-   Search by video, playlist/album, channel/artist
-   Stream audio from YouTube and SoundCloud

# Why play-dl ?

[ytdl-core](https://github.com/fent/node-ytdl-core) has some issues with miniget and also stream abort issues. On the other hand, [youtube-dl](https://github.com/ytdl-org/youtube-dl) is a perfect alternative but it takes time to launch. Hence, play-dl is created to avoid these issues along with providing comparatively faster performance than others.

[![Discord](https://img.shields.io/discord/888998674716315679?color=00aa00&label=%20Discord&logo=Discord)](https://discord.gg/8H3xWcv3D7)
[![NPM](https://img.shields.io/npm/v/play-dl.svg?color=00aa00&logo=npm)](https://www.npmjs.com/package/play-dl)

## Support

You can contact us for support on our [chat server](https://discord.gg/8H3xWcv3D7).

### Installation

**Node.js 16.0.0 or newer is required.**

```bash
npm install git+https://github.com/k2helix/play-dl-compiled.git
pnpm add however you install github repositories with pnpm
yarn add however you install github repositories with yarn
```

### Importing

**TypeScript:**
```ts
import play from 'play-dl'; // Everything

import { video_basic_info, stream } from 'play-dl'; // Individual functions
```

**CommonJS modules:**
```js
const play = require('play-dl'); // Everything

// Individual functions by using destructuring
const { video_basic_info, stream } = require('play-dl');
```

**ES6 modules:**
```ts
import play from 'play-dl'; // Everything

import { video_basic_info, stream } from 'play-dl'; // Individual functions
```

## **Compatibility issues** - discord-player
    
Because discord-player doesn't work with raw opus packets you need to enable the compatibility mode in `play-dl`, if you want to use both frameworks together.

- To fix the playback of YouTube videos with `discord-player`, you can disable some of play-dl's optimisations and fixes by setting the `discordPlayerCompatibility` option for `stream` and `stream_from_info` to true

- The `discordPlayerCompatiblity` option might break the playback of long YouTube videos.

- Even with the `discordPlayerCompatibility` option set you will not be able to use the seek option for `stream` and `stream_from_info`.
    

### [Documentation](https://play-dl.github.io/modules.html)
### [Examples](./examples)
### [Instructions](./instructions)