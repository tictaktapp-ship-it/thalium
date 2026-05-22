export async function load({ locals: { safeGetSession } }) {
  const { session, user } = await safeGetSession()
  return { session, user }
}
