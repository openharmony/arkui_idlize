import { ApplicationContext } from "#compat"

export function run() {
    console.log(`Context test app`)
    const appCtx = new ApplicationContext()
    const currentAppCloneIndex = appCtx.getCurrentAppCloneIndex()
    console.log(`current app clone index: ${currentAppCloneIndex}`)
}
