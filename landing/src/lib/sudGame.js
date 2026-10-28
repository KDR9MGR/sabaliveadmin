/* Starts a SUD game in a container: the web SDK flow of SUD's own demo (hello-sud-plus-h5): initSDK -> loadMG, answering the SDK's questions (how big is the
   view, what is the game config, the login code expired). The SDK packages are imported only here and only when a game is opened, so the rest of the site never
   loads them. Returns { destroy }. Everything the SDK needs is in `params` (see sudParams.js); nothing is logged. */
import { viewInfo, refreshRequest, startFailure, bundleIdFor, EXIT_URL } from './sudParams.js'

const ok = JSON.stringify({ ret_code: 0, ret_msg: 'success' })

export async function startSudGame({ root, params, onProgress, onStarted, onError, onExit }) {
  let destroyed = false
  let fst = null
  let decorators = null

  try {
    const [{ SudMGP }, wrapper] = await Promise.all([import('sudmgp-sdk-js'), import('sudmgp-sdk-js-wrapper')])
    const { GameConfigModel, SudFSMMGDecorator, SudFSTAPPDecorator } = wrapper
    const fsmmg = new SudFSMMGDecorator()
    const fstapp = new SudFSTAPPDecorator()
    decorators = { fsmmg, fstapp }

    fsmmg.setSudFSMMGListener({
      onGameStarted() { if (!destroyed) onStarted?.() },
      onGameLoadingProgress(stage, retCode, progress) { if (!destroyed && retCode === 0) onProgress?.(progress) },
      onGameLog() {},
      // How big is the view: the container's size in device pixels (the SDK sends the pixel ratio it wants).
      onGetGameViewInfo(handle, dataJson) {
        let ratio = window.devicePixelRatio || 1
        try { ratio = JSON.parse(dataJson)?.ratio || ratio } catch { /* keep the device's */ }
        handle.success(JSON.stringify(viewInfo(root.clientWidth, root.clientHeight, ratio)))
      },
      onGetGameCfg(handle) { handle.success(JSON.stringify(new GameConfigModel())) },
      // The login code lives 2 hours: ask our server for a new one (proved by the launch token) and give it to the SDK.
      async onExpireCode(handle) {
        try {
          if (!params.api || !params.t) throw new Error('no way to renew')
          const req = refreshRequest(params.api, params.t)
          const res = await fetch(req.url, req.init)
          const body = await res.json()
          if (!res.ok || !body?.code) throw new Error('refused')
          fstapp.updateCode(body.code, { onSuccess() { handle.success(ok) }, onFailure() { handle.fail(JSON.stringify({ ret_code: 1, ret_msg: 'failed' })) } })
        } catch {
          handle.fail(JSON.stringify({ ret_code: 1, ret_msg: 'failed' }))
        }
      },
      // The game asks to go back to the lobby: that is the end of this screen; the app closes the panel when it sees this link.
      onGameMGCommonGameBackLobby(handle) {
        handle.success(ok)
        onExit?.(EXIT_URL)
      },
    })

    await new Promise((resolve, reject) => {
      // The web SDK's bundle id is this page's host name without www: it must be one set in the SUD console ("Web bundle_id", see bundleIdFor).
      SudMGP.initSDK(params.appId, params.appKey, bundleIdFor(window.location.hostname), params.test, {
        onSuccess: resolve,
        onFailure: (code) => reject(Object.assign(new Error('init'), { code })),
      })
    })
    if (destroyed) return { destroy() {} }
    fst = SudMGP.loadMG(params.userId, params.roomId, params.code, params.gameId, params.lang, fsmmg, root)
    if (fst) fstapp.setISudFSTAPP(fst)
  } catch (e) {
    onError?.(startFailure(e?.code))
    return { destroy() {} }
  }

  return {
    destroy() {
      destroyed = true
      try {
        decorators?.fstapp.notifyAPPCommon('app_common_self_exit_game', JSON.stringify({}), { onSuccess() {}, onFailure() {} })
        if (fst) import('sudmgp-sdk-js').then(({ SudMGP }) => SudMGP.destroyMG(fst))
        decorators?.fstapp.destroyMG()
        decorators?.fsmmg.destroyMG()
      } catch { /* leaving anyway */ }
      root.innerHTML = ''
    },
  }
}
