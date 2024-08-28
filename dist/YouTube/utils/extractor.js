"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContinuationToken = exports.getPlaylistVideos = exports.playlist_info = exports.decipher_info = exports.video_info = exports.video_stream_info = exports.video_basic_info = exports.extractID = exports.yt_validate = void 0;
const index_1 = require("./../../Request/index");
const cipher_1 = require("./cipher");
const Video_1 = require("../classes/Video");
const Playlist_1 = require("../classes/Playlist");
const node_url_1 = require("node:url");
const stream_1 = require("../stream");
const video_id_pattern = /^[a-zA-Z\d_-]{11,12}$/;
const playlist_id_pattern = /^(PL|UU|LL|RD|OL)[a-zA-Z\d_-]{10,}$/;
const DEFAULT_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
const video_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|shorts\/|embed\/|live\/|v\/)?)([\w\-]+)(\S+)?$/;
const playlist_pattern = /^((?:https?:)?\/\/)?(?:(?:www|m|music)\.)?((?:youtube\.com|youtu.be))\/(?:(playlist|watch))?(.*)?((\?|\&)list=)(PL|UU|LL|RD|OL)[a-zA-Z\d_-]{10,}(&.*)?$/;
/**
 * Validate YouTube URL or ID.
 *
 * **CAUTION :** If your search word is 11 or 12 characters long, you might get it validated as video ID.
 *
 * To avoid above, add one more condition to yt_validate
 * ```ts
 * if (url.startsWith('https') && yt_validate(url) === 'video') {
 *      // YouTube Video Url.
 * }
 * ```
 * @param url YouTube URL OR ID
 * @returns
 * ```
 * 'playlist' | 'video' | 'search' | false
 * ```
 */
function yt_validate(url) {
    const url_ = url.trim();
    if (url_.indexOf('list=') === -1) {
        if (url_.startsWith('https')) {
            if (url_.match(video_pattern)) {
                let id;
                if (url_.includes('youtu.be/'))
                    id = url_.split('youtu.be/')[1].split(/(\?|\/|&)/)[0];
                else if (url_.includes('youtube.com/embed/'))
                    id = url_.split('youtube.com/embed/')[1].split(/(\?|\/|&)/)[0];
                else if (url_.includes('youtube.com/shorts/'))
                    id = url_.split('youtube.com/shorts/')[1].split(/(\?|\/|&)/)[0];
                else
                    id = url_.split('watch?v=')[1]?.split(/(\?|\/|&)/)[0];
                if (id?.match(video_id_pattern))
                    return 'video';
                else
                    return false;
            }
            else
                return false;
        }
        else {
            if (url_.match(video_id_pattern))
                return 'video';
            else if (url_.match(playlist_id_pattern))
                return 'playlist';
            else
                return 'search';
        }
    }
    else {
        if (!url_.match(playlist_pattern))
            return yt_validate(url_.replace(/(\?|\&)list=[^&]*/, ''));
        else
            return 'playlist';
    }
}
exports.yt_validate = yt_validate;
/**
 * Extracts the video ID from a YouTube URL.
 *
 * Will return the value of `urlOrId` if it looks like a video ID.
 * @param urlOrId A YouTube URL or video ID
 * @returns the video ID or `false` if it can't find a video ID.
 */
function extractVideoId(urlOrId) {
    if (urlOrId.startsWith('https://') && urlOrId.match(video_pattern)) {
        let id;
        if (urlOrId.includes('youtu.be/')) {
            id = urlOrId.split('youtu.be/')[1].split(/(\?|\/|&)/)[0];
        }
        else if (urlOrId.includes('youtube.com/embed/')) {
            id = urlOrId.split('youtube.com/embed/')[1].split(/(\?|\/|&)/)[0];
        }
        else if (urlOrId.includes('youtube.com/shorts/')) {
            id = urlOrId.split('youtube.com/shorts/')[1].split(/(\?|\/|&)/)[0];
        }
        else if (urlOrId.includes('youtube.com/live/')) {
            id = urlOrId.split('youtube.com/live/')[1].split(/(\?|\/|&)/)[0];
        }
        else {
            id = (urlOrId.split('watch?v=')[1] ?? urlOrId.split('&v=')[1]).split(/(\?|\/|&)/)[0];
        }
        if (id.match(video_id_pattern))
            return id;
    }
    else if (urlOrId.match(video_id_pattern)) {
        return urlOrId;
    }
    return false;
}
/**
 * Extract ID of YouTube url.
 * @param url ID or url of YouTube
 * @returns ID of video or playlist.
 */
function extractID(url) {
    const check = yt_validate(url);
    if (!check || check === 'search')
        throw new Error('This is not a YouTube url or videoId or PlaylistID');
    const url_ = url.trim();
    if (url_.startsWith('https')) {
        if (url_.indexOf('list=') === -1) {
            const video_id = extractVideoId(url_);
            if (!video_id)
                throw new Error('This is not a YouTube url or videoId or PlaylistID');
            return video_id;
        }
        else {
            return url_.split('list=')[1].split('&')[0];
        }
    }
    else
        return url_;
}
exports.extractID = extractID;
/**
 * Basic function to get data from a YouTube url or ID.
 *
 * Example
 * ```ts
 * const video = await play.video_basic_info('youtube video url')
 *
 * const res = ... // Any https package get function.
 *
 * const video = await play.video_basic_info(res.body, { htmldata : true })
 * ```
 * @param url YouTube url or ID or html body data
 * @param options Video Info Options
 *  - `boolean` htmldata : given data is html data or not
 * @returns Video Basic Info {@link InfoData}.
 */
async function video_basic_info(url, options = {}) {
    if (typeof url !== 'string')
        throw new Error('url parameter is not a URL string or a string of HTML');
    const url_ = url.trim();
    let body;
    const cookieJar = {};
    if (options.htmldata) {
        body = url_;
    }
    else {
        const video_id = extractVideoId(url_);
        if (!video_id)
            throw new Error('This is not a YouTube Watch URL');
        const new_url = `https://www.youtube.com/watch?v=${video_id}&has_verified=1`;
        body = await (0, index_1.request)(new_url, {
            headers: {
                'accept-language': options.language || 'en-US;q=0.9'
            },
            cookies: true,
            cookieJar,
            proxy: options.proxy
        });
    }
    if (body.indexOf('Our systems have detected unusual traffic from your computer network.') !== -1)
        throw new Error('Captcha page: YouTube has detected that you are a bot!');
    const player_data = body
        .split('var ytInitialPlayerResponse = ')?.[1]
        ?.split(';</script>')[0]
        .split(/(?<=}}});\s*(var|const|let)\s/)[0];
    if (!player_data)
        throw new Error('Initial Player Response Data is undefined.');
    const initial_data = body
        .split('var ytInitialData = ')?.[1]
        ?.split(';</script>')[0]
        .split(/;\s*(var|const|let)\s/)[0];
    if (!initial_data)
        throw new Error('Initial Response Data is undefined.');
    const player_response = JSON.parse(player_data);
    const initial_response = JSON.parse(initial_data);
    const vid = player_response.videoDetails;
    let discretionAdvised = false;
    let upcoming = false;
    if (player_response.playabilityStatus.status !== 'OK') {
        if (player_response.playabilityStatus.status === 'CONTENT_CHECK_REQUIRED') {
            if (options.htmldata)
                throw new Error(`Accepting the viewer discretion is not supported when using htmldata, video: ${vid.videoId}`);
            discretionAdvised = true;
            const cookies = initial_response.topbar.desktopTopbarRenderer.interstitial?.consentBumpV2Renderer.agreeButton
                .buttonRenderer.command.saveConsentAction;
            if (cookies) {
                Object.assign(cookieJar, {
                    VISITOR_INFO1_LIVE: cookies.visitorCookie,
                    CONSENT: cookies.consentCookie
                });
            }
            const updatedValues = await acceptViewerDiscretion(vid.videoId, cookieJar, body, true);
            player_response.streamingData = updatedValues.streamingData;
            initial_response.contents.twoColumnWatchNextResults.secondaryResults = updatedValues.relatedVideos;
        }
        else if (player_response.playabilityStatus.status === 'LIVE_STREAM_OFFLINE')
            upcoming = true;
        else
            throw new Error(`While getting info from url\n${player_response.playabilityStatus.errorScreen.playerErrorMessageRenderer?.reason.simpleText ??
                player_response.playabilityStatus.errorScreen.playerKavRenderer?.reason.simpleText ??
                player_response.playabilityStatus.reason}`);
    }
    const ownerInfo = initial_response.contents.twoColumnWatchNextResults.results?.results?.contents[1]?.videoSecondaryInfoRenderer
        ?.owner?.videoOwnerRenderer;
    const badge = ownerInfo?.badges?.[0]?.metadataBadgeRenderer?.style?.toLowerCase();
    const html5player = `https://www.youtube.com${body.split('"jsUrl":"')[1].split('"')[0]}`;
    const related = [];
    initial_response.contents.twoColumnWatchNextResults.secondaryResults.secondaryResults.results.forEach((res) => {
        if (res.compactVideoRenderer)
            related.push(`https://www.youtube.com/watch?v=${res.compactVideoRenderer.videoId}`);
        if (res.itemSectionRenderer?.contents)
            res.itemSectionRenderer.contents.forEach((x) => {
                if (x.compactVideoRenderer)
                    related.push(`https://www.youtube.com/watch?v=${x.compactVideoRenderer.videoId}`);
            });
    });
    const microformat = player_response.microformat.playerMicroformatRenderer;
    const musicInfo = initial_response.engagementPanels.find((item) => item?.engagementPanelSectionListRenderer?.panelIdentifier == 'engagement-panel-structured-description')?.engagementPanelSectionListRenderer.content.structuredDescriptionContentRenderer.items
        .find((el) => el.videoDescriptionMusicSectionRenderer)?.videoDescriptionMusicSectionRenderer.carouselLockups;
    const music = [];
    if (musicInfo) {
        musicInfo.forEach((x) => {
            if (!x.carouselLockupRenderer)
                return;
            const row = x.carouselLockupRenderer;
            const song = row.videoLockup?.compactVideoRenderer.title.simpleText ?? row.videoLockup?.compactVideoRenderer.title.runs?.find((x) => x.text)?.text;
            const metadata = row.infoRows?.map((info) => [info.infoRowRenderer.title.simpleText.toLowerCase(), ((info.infoRowRenderer.expandedMetadata ?? info.infoRowRenderer.defaultMetadata)?.runs?.map((i) => i.text).join("")) ?? info.infoRowRenderer.defaultMetadata?.simpleText ?? info.infoRowRenderer.expandedMetadata?.simpleText ?? ""]);
            const contents = Object.fromEntries(metadata ?? {});
            const id = row.videoLockup?.compactVideoRenderer.navigationEndpoint?.watchEndpoint.videoId
                ?? row.infoRows?.find((x) => x.infoRowRenderer.title.simpleText.toLowerCase() == "song")?.infoRowRenderer.defaultMetadata.runs?.find((x) => x.navigationEndpoint)?.navigationEndpoint.watchEndpoint?.videoId;
            music.push({ song, url: id ? `https://www.youtube.com/watch?v=${id}` : null, ...contents });
        });
    }
    const rawChapters = initial_response.playerOverlays.playerOverlayRenderer.decoratedPlayerBarRenderer?.decoratedPlayerBarRenderer.playerBar?.multiMarkersPlayerBarRenderer.markersMap?.find((m) => m.key === 'DESCRIPTION_CHAPTERS')?.value?.chapters;
    const chapters = [];
    if (rawChapters) {
        for (const { chapterRenderer } of rawChapters) {
            chapters.push({
                title: chapterRenderer.title.simpleText,
                timestamp: parseSeconds(chapterRenderer.timeRangeStartMillis / 1000),
                seconds: chapterRenderer.timeRangeStartMillis / 1000,
                thumbnails: chapterRenderer.thumbnail.thumbnails
            });
        }
    }
    let upcomingDate;
    if (upcoming) {
        if (microformat.liveBroadcastDetails.startTimestamp)
            upcomingDate = new Date(microformat.liveBroadcastDetails.startTimestamp);
        else {
            const timestamp = player_response.playabilityStatus.liveStreamability.liveStreamabilityRenderer.offlineSlate
                .liveStreamOfflineSlateRenderer.scheduledStartTime;
            upcomingDate = new Date(parseInt(timestamp) * 1000);
        }
    }
    const likeRenderer = initial_response.contents.twoColumnWatchNextResults.results.results.contents
        .find((content) => content.videoPrimaryInfoRenderer)
        ?.videoPrimaryInfoRenderer.videoActions.menuRenderer.topLevelButtons?.find((button) => button.toggleButtonRenderer?.defaultIcon.iconType === 'LIKE' || button.segmentedLikeDislikeButtonRenderer?.likeButton.toggleButtonRenderer?.defaultIcon.iconType === 'LIKE');
    const video_details = new Video_1.YouTubeVideo({
        id: vid.videoId,
        title: vid.title,
        description: vid.shortDescription,
        duration: Number(vid.lengthSeconds),
        duration_raw: parseSeconds(vid.lengthSeconds),
        uploadedAt: microformat.publishDate,
        liveAt: microformat.liveBroadcastDetails?.startTimestamp,
        upcoming: upcomingDate,
        thumbnails: vid.thumbnail.thumbnails,
        channel: {
            name: vid.author,
            id: vid.channelId,
            url: `https://www.youtube.com/channel/${vid.channelId}`,
            verified: Boolean(badge?.includes('verified')),
            artist: Boolean(badge?.includes('artist')),
            icons: ownerInfo?.thumbnail?.thumbnails || undefined
        },
        views: vid.viewCount,
        tags: vid.keywords,
        likes: parseInt(likeRenderer?.toggleButtonRenderer?.defaultText.accessibility?.accessibilityData.label.replace(/\D+/g, '') ??
            likeRenderer?.segmentedLikeDislikeButtonRenderer?.likeButton.toggleButtonRenderer?.defaultText.accessibility?.accessibilityData.label.replace(/\D+/g, '') ?? 0),
        live: vid.isLiveContent,
        private: vid.isPrivate,
        discretionAdvised,
        music,
        chapters
    });
    let format = [];
    if (!upcoming) {
        // TODO: Properly handle the formats, for now ignore and use iOS formats
        //format.push(...(player_response.streamingData.formats ?? []));
        //format.push(...(player_response.streamingData.adaptiveFormats ?? []));
        // get the formats for the android player for legacy videos
        // fixes the stream being closed because not enough data
        // arrived in time for ffmpeg to be able to extract audio data
        //if (parseAudioFormats(format).length === 0 && !options.htmldata) {
        //    format = await getAndroidFormats(vid.videoId, cookieJar, body);
        //}
        format = await getIosFormats(vid.videoId, cookieJar, body);
    }
    const LiveStreamData = {
        isLive: video_details.live,
        dashManifestUrl: player_response.streamingData?.dashManifestUrl ?? null,
        hlsManifestUrl: player_response.streamingData?.hlsManifestUrl ?? null
    };
    return {
        LiveStreamData,
        html5player,
        format,
        video_details,
        related_videos: related
    };
}
exports.video_basic_info = video_basic_info;
/**
 * Gets the data required for streaming from YouTube url, ID or html body data and deciphers it.
 *
 * Internal function used by {@link stream} instead of {@link video_info}
 * because it only extracts the information required for streaming.
 *
 * @param url YouTube url or ID or html body data
 * @param options Video Info Options
 *  - `boolean` htmldata : given data is html data or not
 * @returns Deciphered Video Info {@link StreamInfoData}.
 */
async function video_stream_info(url, options = {}) {
    if (typeof url !== 'string')
        throw new Error('url parameter is not a URL string or a string of HTML');
    let body;
    const cookieJar = {};
    if (options.htmldata) {
        body = url;
    }
    else {
        const video_id = extractVideoId(url);
        if (!video_id)
            throw new Error('This is not a YouTube Watch URL');
        const new_url = `https://www.youtube.com/watch?v=${video_id}&has_verified=1`;
        body = await (0, index_1.request)(new_url, {
            headers: { 'accept-language': 'en-US,en;q=0.9' },
            cookies: true,
            cookieJar,
            proxy: options.proxy
        });
    }
    if (body.indexOf('Our systems have detected unusual traffic from your computer network.') !== -1)
        throw new Error('Captcha page: YouTube has detected that you are a bot!');
    const player_data = body
        .split('var ytInitialPlayerResponse = ')?.[1]
        ?.split(';</script>')[0]
        .split(/(?<=}}});\s*(var|const|let)\s/)[0];
    if (!player_data)
        throw new Error('Initial Player Response Data is undefined.');
    const player_response = JSON.parse(player_data);
    let upcoming = false;
    if (player_response.playabilityStatus.status !== 'OK') {
        if (player_response.playabilityStatus.status === 'CONTENT_CHECK_REQUIRED') {
            if (options.htmldata)
                throw new Error(`Accepting the viewer discretion is not supported when using htmldata, video: ${player_response.videoDetails.videoId}`);
            const initial_data = body
                .split('var ytInitialData = ')?.[1]
                ?.split(';</script>')[0]
                .split(/;\s*(var|const|let)\s/)[0];
            if (!initial_data)
                throw new Error('Initial Response Data is undefined.');
            const cookies = JSON.parse(initial_data).topbar.desktopTopbarRenderer.interstitial?.consentBumpV2Renderer.agreeButton
                .buttonRenderer.command.saveConsentAction;
            if (cookies) {
                Object.assign(cookieJar, {
                    VISITOR_INFO1_LIVE: cookies.visitorCookie,
                    CONSENT: cookies.consentCookie
                });
            }
            const updatedValues = await acceptViewerDiscretion(player_response.videoDetails.videoId, cookieJar, body, false);
            player_response.streamingData = updatedValues.streamingData;
        }
        else if (player_response.playabilityStatus.status === 'LIVE_STREAM_OFFLINE')
            upcoming = true;
        else
            throw new Error(`While getting info from url\n${player_response.playabilityStatus.errorScreen.playerErrorMessageRenderer?.reason.simpleText ??
                player_response.playabilityStatus.errorScreen.playerKavRenderer?.reason.simpleText ??
                player_response.playabilityStatus.reason}`);
    }
    const html5player = `https://www.youtube.com${body.split('"jsUrl":"')[1].split('"')[0]}`;
    const duration = Number(player_response.videoDetails.lengthSeconds);
    const video_details = {
        url: `https://www.youtube.com/watch?v=${player_response.videoDetails.videoId}`,
        durationInSec: (duration < 0 ? 0 : duration) || 0
    };
    let format = [];
    if (!upcoming) {
        // TODO: Properly handle the formats, for now ignore and use iOS formats
        //format.push(...(player_response.streamingData.formats ?? []));
        //format.push(...(player_response.streamingData.adaptiveFormats ?? []));
        // get the formats for the android player for legacy videos
        // fixes the stream being closed because not enough data
        // arrived in time for ffmpeg to be able to extract audio data
        //if (parseAudioFormats(format).length === 0 && !options.htmldata) {
        //    format = await getAndroidFormats(player_response.videoDetails.videoId, cookieJar, body);
        //}
        format = await getIosFormats(player_response.videoDetails.videoId, cookieJar, body);
    }
    const LiveStreamData = {
        isLive: player_response.videoDetails.isLiveContent,
        dashManifestUrl: player_response.streamingData?.dashManifestUrl ?? null,
        hlsManifestUrl: player_response.streamingData?.hlsManifestUrl ?? null
    };
    return await decipher_info({
        LiveStreamData,
        html5player,
        format,
        video_details
    }, true);
}
exports.video_stream_info = video_stream_info;
/**
 * Function to convert seconds to [hour : minutes : seconds] format
 * @param seconds seconds to convert
 * @returns [hour : minutes : seconds] format
 */
function parseSeconds(seconds) {
    const d = Number(seconds);
    const h = Math.floor(d / 3600);
    const m = Math.floor((d % 3600) / 60);
    const s = Math.floor((d % 3600) % 60);
    const hDisplay = h > 0 ? (h < 10 ? `0${h}` : h) + ':' : '';
    const mDisplay = m > 0 ? (m < 10 ? `0${m}` : m) + ':' : '00:';
    const sDisplay = s > 0 ? (s < 10 ? `0${s}` : s) : '00';
    return hDisplay + mDisplay + sDisplay;
}
/**
 * Gets data from YouTube url or ID or html body data and deciphers it.
 * ```
 * video_basic_info + decipher_info = video_info
 * ```
 *
 * Example
 * ```ts
 * const video = await play.video_info('youtube video url')
 *
 * const res = ... // Any https package get function.
 *
 * const video = await play.video_info(res.body, { htmldata : true })
 * ```
 * @param url YouTube url or ID or html body data
 * @param options Video Info Options
 *  - `boolean` htmldata : given data is html data or not
 * @returns Deciphered Video Info {@link InfoData}.
 */
async function video_info(url, options = {}) {
    const data = await video_basic_info(url.trim(), options);
    return await decipher_info(data);
}
exports.video_info = video_info;
/**
 * Function uses data from video_basic_info and deciphers it if it contains signatures.
 * @param data Data - {@link InfoData}
 * @param audio_only `boolean` - To decipher only audio formats only.
 * @returns Deciphered Video Info {@link InfoData}
 */
async function decipher_info(data, audio_only = false) {
    if (data.LiveStreamData.isLive === true &&
        data.LiveStreamData.dashManifestUrl !== null &&
        data.video_details.durationInSec === 0) {
        return data;
    }
    else if (data.format.length > 0 && (data.format[0].signatureCipher || data.format[0].cipher)) {
        if (audio_only)
            data.format = (0, stream_1.parseAudioFormats)(data.format);
        data.format = await (0, cipher_1.format_decipher)(data.format, data.html5player);
        return data;
    }
    else
        return data;
}
exports.decipher_info = decipher_info;
/**
 * Gets YouTube playlist info from a playlist url.
 *
 * Example
 * ```ts
 * const playlist = await play.playlist_info('youtube playlist url')
 *
 * const playlist = await play.playlist_info('youtube playlist url', { incomplete : true })
 * ```
 * @param url Playlist URL
 * @param options Playlist Info Options
 * - `boolean` incomplete : When this is set to `false` (default) this function will throw an error
 *                          if the playlist contains hidden videos.
 *                          If it is set to `true`, it parses the playlist skipping the hidden videos,
 *                          only visible videos are included in the resulting {@link YouTubePlaylist}.
 *
 * @returns YouTube Playlist
 */
async function playlist_info(url, options = {}) {
    if (!url || typeof url !== 'string')
        throw new Error(`Expected playlist url, received ${typeof url}!`);
    let url_ = url.trim();
    if (!url_.startsWith('https'))
        url_ = `https://www.youtube.com/playlist?list=${url_}`;
    if (url_.indexOf('list=') === -1)
        throw new Error('This is not a Playlist URL');
    if (url_.includes('music.youtube.com')) {
        const urlObj = new node_url_1.URL(url_);
        urlObj.hostname = 'www.youtube.com';
        url_ = urlObj.toString();
    }
    const body = await (0, index_1.request)(url_, {
        headers: {
            'accept-language': options.language || 'en-US;q=0.9'
        }
    });
    if (body.indexOf('Our systems have detected unusual traffic from your computer network.') !== -1)
        throw new Error('Captcha page: YouTube has detected that you are a bot!');
    const response = JSON.parse(body
        .split('var ytInitialData = ')[1]
        .split(';</script>')[0]
        .split(/;\s*(var|const|let)\s/)[0]);
    if (response.alerts) {
        if (response.alerts[0].alertWithButtonRenderer?.type === 'INFO') {
            if (!options.incomplete)
                throw new Error(`While parsing playlist url\n${response.alerts[0].alertWithButtonRenderer.text.simpleText}`);
        }
        else if (response.alerts[0].alertRenderer?.type === 'ERROR')
            throw new Error(`While parsing playlist url\n${response.alerts[0].alertRenderer.text.runs[0].text}`);
        else
            throw new Error('While parsing playlist url\nUnknown Playlist Error');
    }
    if (response.currentVideoEndpoint) {
        return getWatchPlaylist(response, body, url_);
    }
    else
        return getNormalPlaylist(response, body);
}
exports.playlist_info = playlist_info;
/**
 * Function to parse Playlist from YouTube search
 * @param data html data of that request
 * @param limit No. of videos to parse
 * @returns Array of YouTubeVideo.
 */
function getPlaylistVideos(data, limit = Infinity) {
    const videos = [];
    for (let i = 0; i < data.length; i++) {
        if (limit === videos.length)
            break;
        const info = data[i].playlistVideoRenderer;
        if (!info || !info.shortBylineText)
            continue;
        videos.push(new Video_1.YouTubeVideo({
            id: info.videoId,
            duration: parseInt(info.lengthSeconds) || 0,
            duration_raw: info.lengthText?.simpleText ?? '0:00',
            thumbnails: info.thumbnail.thumbnails,
            title: info.title.runs[0].text,
            upcoming: info.upcomingEventData?.startTime
                ? new Date(parseInt(info.upcomingEventData.startTime) * 1000)
                : undefined,
            channel: {
                id: info.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.browseId || undefined,
                name: info.shortBylineText.runs[0].text || undefined,
                url: `https://www.youtube.com${info.shortBylineText.runs[0].navigationEndpoint.browseEndpoint.canonicalBaseUrl ||
                    info.shortBylineText.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
                icon: undefined
            }
        }));
    }
    return videos;
}
exports.getPlaylistVideos = getPlaylistVideos;
/**
 * Function to get Continuation Token
 * @param data html data of playlist url
 * @returns token
 */
function getContinuationToken(data) {
    return data.find((x) => Object.keys(x)[0] === 'continuationItemRenderer')?.continuationItemRenderer
        .continuationEndpoint?.continuationCommand?.token;
}
exports.getContinuationToken = getContinuationToken;
async function acceptViewerDiscretion(videoId, cookieJar, body, extractRelated) {
    const apiKey = body.split('INNERTUBE_API_KEY":"')[1]?.split('"')[0] ??
        body.split('innertubeApiKey":"')[1]?.split('"')[0] ??
        DEFAULT_API_KEY;
    const sessionToken = body.split('"XSRF_TOKEN":"')[1]?.split('"')[0].replaceAll('\\u003d', '=') ??
        body.split('"xsrf_token":"')[1]?.split('"')[0].replaceAll('\\u003d', '=');
    if (!sessionToken)
        throw new Error(`Unable to extract XSRF_TOKEN to accept the viewer discretion popup for video: ${videoId}.`);
    const verificationResponse = await (0, index_1.request)(`https://www.youtube.com/youtubei/v1/verify_age?key=${apiKey}&prettyPrint=false`, {
        method: 'POST',
        body: JSON.stringify({
            context: {
                client: {
                    utcOffsetMinutes: 0,
                    gl: 'US',
                    hl: 'en',
                    clientName: 'WEB',
                    clientVersion: body.split('"INNERTUBE_CONTEXT_CLIENT_VERSION":"')[1]?.split('"')[0] ??
                        body.split('"innertube_context_client_version":"')[1]?.split('"')[0] ??
                        '<some version>'
                },
                user: {},
                request: {}
            },
            nextEndpoint: {
                urlEndpoint: {
                    url: `/watch?v=${videoId}&has_verified=1`
                }
            },
            setControvercy: true
        }),
        cookies: true,
        cookieJar
    });
    const endpoint = JSON.parse(verificationResponse).actions[0].navigateAction.endpoint;
    const videoPage = await (0, index_1.request)(`https://www.youtube.com/${endpoint.urlEndpoint.url}&pbj=1`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new node_url_1.URLSearchParams([
            ['command', JSON.stringify(endpoint)],
            ['session_token', sessionToken]
        ]).toString(),
        cookies: true,
        cookieJar
    });
    if (videoPage.includes('<h1>Something went wrong</h1>'))
        throw new Error(`Unable to accept the viewer discretion popup for video: ${videoId}`);
    const videoPageData = JSON.parse(videoPage);
    if (videoPageData[2].playerResponse.playabilityStatus.status !== 'OK')
        throw new Error(`While getting info from url after trying to accept the discretion popup for video ${videoId}\n${videoPageData[2].playerResponse.playabilityStatus.errorScreen.playerErrorMessageRenderer?.reason
            .simpleText ??
            videoPageData[2].playerResponse.playabilityStatus.errorScreen.playerKavRenderer?.reason.simpleText}`);
    const streamingData = videoPageData[2].playerResponse.streamingData;
    if (extractRelated)
        return {
            streamingData,
            relatedVideos: videoPageData[3].response.contents.twoColumnWatchNextResults.secondaryResults
        };
    return { streamingData };
}
async function getIosFormats(videoId, cookieJar, body) {
    const apiKey = body.split('INNERTUBE_API_KEY":"')[1]?.split('"')[0] ??
        body.split('innertubeApiKey":"')[1]?.split('"')[0] ??
        DEFAULT_API_KEY;
    const response = await (0, index_1.request)(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}&prettyPrint=false`, {
        method: 'POST',
        body: JSON.stringify({
            context: {
                client: {
                    clientName: 'IOS',
                    clientVersion: '19.09.3',
                    deviceModel: 'iPhone16,1',
                    userAgent: 'com.google.ios.youtube/19.09.3 (iPhone; CPU iPhone OS 17_5 like Mac OS X)',
                    hl: 'en',
                    timeZone: 'UTC',
                    utcOffsetMinutes: 0
                }
            },
            videoId: videoId,
            playbackContext: { contentPlaybackContext: { html5Preference: 'HTML5_PREF_WANTS' } },
            contentCheckOk: true,
            racyCheckOk: true
        }),
        cookies: true,
        cookieJar
    });
    return JSON.parse(response).streamingData.adaptiveFormats;
    //return JSON.parse(response).streamingData.formats;
}
function getWatchPlaylist(response, body, url) {
    const playlist_details = response.contents.twoColumnWatchNextResults.playlist?.playlist;
    if (!playlist_details)
        throw new Error("Watch playlist unavailable due to YouTube layout changes.");
    const videos = getWatchPlaylistVideos(playlist_details.contents);
    const API_KEY = body.split('INNERTUBE_API_KEY":"')[1]?.split('"')[0] ??
        body.split('innertubeApiKey":"')[1]?.split('"')[0] ??
        DEFAULT_API_KEY;
    const videoCount = playlist_details.totalVideos;
    const channel = playlist_details.shortBylineText?.runs?.[0];
    const badge = playlist_details.badges?.[0]?.metadataBadgeRenderer?.style.toLowerCase();
    return new Playlist_1.YouTubePlayList({
        continuation: {
            api: API_KEY,
            token: getContinuationToken(playlist_details.contents),
            clientVersion: body.split('"INNERTUBE_CONTEXT_CLIENT_VERSION":"')[1]?.split('"')[0] ??
                body.split('"innertube_context_client_version":"')[1]?.split('"')[0] ??
                '<some version>'
        },
        id: playlist_details.playlistId || '',
        title: playlist_details.title || '',
        videoCount: parseInt(videoCount) || 0,
        videos: videos,
        url: url,
        channel: {
            id: channel?.navigationEndpoint?.browseEndpoint?.browseId || null,
            name: channel?.text || null,
            url: `https://www.youtube.com${channel?.navigationEndpoint?.browseEndpoint?.canonicalBaseUrl ||
                channel?.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url}`,
            verified: Boolean(badge?.includes('verified')),
            artist: Boolean(badge?.includes('artist'))
        }
    });
}
function getNormalPlaylist(response, body) {
    const json_data = response.contents.twoColumnBrowseResultsRenderer.tabs[0].tabRenderer.content.sectionListRenderer.contents[0]
        .itemSectionRenderer.contents[0].playlistVideoListRenderer.contents;
    const playlist_details = response.sidebar.playlistSidebarRenderer.items;
    const API_KEY = body.split('INNERTUBE_API_KEY":"')[1]?.split('"')[0] ??
        body.split('innertubeApiKey":"')[1]?.split('"')[0] ??
        DEFAULT_API_KEY;
    const videos = getPlaylistVideos(json_data, 100);
    const data = playlist_details[0].playlistSidebarPrimaryInfoRenderer;
    if (!data.title.runs || !data.title.runs.length)
        throw new Error('Failed to Parse Playlist info.');
    const author = playlist_details[1]?.playlistSidebarSecondaryInfoRenderer.videoOwner;
    const views = data.stats.length === 3 ? data.stats[1].simpleText.replace(/\D/g, '') : 0;
    const lastUpdate = data.stats
        .find((x) => 'runs' in x && x['runs'].find((y) => y.text.toLowerCase().includes('last update')))
        ?.runs.pop()?.text ?? null;
    const videosCount = data.stats[0].runs[0].text.replace(/\D/g, '') || 0;
    const res = new Playlist_1.YouTubePlayList({
        continuation: {
            api: API_KEY,
            token: getContinuationToken(json_data),
            clientVersion: body.split('"INNERTUBE_CONTEXT_CLIENT_VERSION":"')[1]?.split('"')[0] ??
                body.split('"innertube_context_client_version":"')[1]?.split('"')[0] ??
                '<some version>'
        },
        id: data.title.runs[0].navigationEndpoint.watchEndpoint.playlistId,
        title: data.title.runs[0].text,
        videoCount: parseInt(videosCount) || 0,
        lastUpdate: lastUpdate,
        views: parseInt(views) || 0,
        videos: videos,
        url: `https://www.youtube.com/playlist?list=${data.title.runs[0].navigationEndpoint.watchEndpoint.playlistId}`,
        link: `https://www.youtube.com${data.title.runs[0].navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
        channel: author
            ? {
                name: author.videoOwnerRenderer.title.runs[0].text,
                id: author.videoOwnerRenderer.title.runs[0].navigationEndpoint.browseEndpoint.browseId,
                url: `https://www.youtube.com${author.videoOwnerRenderer.navigationEndpoint.commandMetadata.webCommandMetadata.url ||
                    author.videoOwnerRenderer.navigationEndpoint.browseEndpoint.canonicalBaseUrl}`,
                icons: author.videoOwnerRenderer.thumbnail.thumbnails ?? []
            }
            : {},
        thumbnail: data.thumbnailRenderer.playlistVideoThumbnailRenderer?.thumbnail.thumbnails.length
            ? data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails[data.thumbnailRenderer.playlistVideoThumbnailRenderer.thumbnail.thumbnails.length - 1]
            : null
    });
    return res;
}
function getWatchPlaylistVideos(data, limit = Infinity) {
    const videos = [];
    for (let i = 0; i < data.length; i++) {
        if (limit === videos.length)
            break;
        const info = data[i].playlistPanelVideoRenderer;
        if (!info || !info.shortBylineText)
            continue;
        const channel_info = info.shortBylineText.runs[0];
        videos.push(new Video_1.YouTubeVideo({
            id: info.videoId,
            duration: parseDuration(info.lengthText?.simpleText) || 0,
            duration_raw: info.lengthText?.simpleText ?? '0:00',
            thumbnails: info.thumbnail.thumbnails,
            title: info.title.simpleText,
            upcoming: info.thumbnailOverlays[0].thumbnailOverlayTimeStatusRenderer?.style === 'UPCOMING' || undefined,
            channel: {
                id: channel_info.navigationEndpoint.browseEndpoint.browseId || undefined,
                name: channel_info.text || undefined,
                url: `https://www.youtube.com${channel_info.navigationEndpoint.browseEndpoint.canonicalBaseUrl ||
                    channel_info.navigationEndpoint.commandMetadata.webCommandMetadata.url}`,
                icon: undefined
            }
        }));
    }
    return videos;
}
function parseDuration(text) {
    if (!text)
        return 0;
    const split = text.split(':');
    switch (split.length) {
        case 2:
            return parseInt(split[0]) * 60 + parseInt(split[1]);
        case 3:
            return parseInt(split[0]) * 60 * 60 + parseInt(split[1]) * 60 + parseInt(split[2]);
        default:
            return 0;
    }
}
//# sourceMappingURL=extractor.js.map