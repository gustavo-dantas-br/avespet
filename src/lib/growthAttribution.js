// Only known channels; no URL/referrer, click IDs, IP or tracking cookies.
export const CHANNELS=["instagram","facebook","google","whatsapp","youtube","indicacao","outro"];
export function channelFromSearch(search){
 const p=new URLSearchParams(search);
 const source=(p.get("utm_source")||"").trim().toLowerCase();
 const aliases={ig:"instagram",fb:"facebook",insta:"instagram",googleads:"google",wa:"whatsapp",yt:"youtube"};
 const normalized=Object.hasOwn(aliases,source)?aliases[source]:source;
 return CHANNELS.includes(normalized)?normalized:"";
}
export function signupAttribution(channel){
 return CHANNELS.includes(channel)?{growth_source_v1:channel}: {};
}
// In-memory only: same page lifecycle, including client-side navigation.
const initialChannel=typeof window!=="undefined"?channelFromSearch(window.location.search):"";
export function suggestedChannel(){
 return initialChannel||(typeof window!=="undefined"?channelFromSearch(window.location.search):"");
}
