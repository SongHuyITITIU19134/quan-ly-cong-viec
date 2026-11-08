export const REQUIRE_VERIFIED_EMAIL=true
export const isVerifiedAccount=user=>Boolean(user?.emailVerified||user?.providerData?.some(item=>item.providerId==='google.com'))
export const isReadOnlyAccount=(mode,user)=>Boolean(mode==='firebase'&&REQUIRE_VERIFIED_EMAIL&&user&&!isVerifiedAccount(user))
