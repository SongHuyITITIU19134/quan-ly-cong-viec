export const ACHIEVE_AT=1
export const GAUGE_STATES={EMPTY:'empty',DANGER:'danger',WARN:'warn',OK:'ok',GOOD:'good',ACHIEVED:'achieved'}

export function getCompletionGauge(done,total){
  const safeTotal=Math.max(0,Number(total)||0),safeDone=Math.min(safeTotal,Math.max(0,Number(done)||0))
  if(safeTotal===0)return{done:0,total:0,ratio:0,percent:0,state:GAUGE_STATES.EMPTY}
  const ratio=safeDone/safeTotal
  const state=ratio>=ACHIEVE_AT?GAUGE_STATES.ACHIEVED:ratio>.7?GAUGE_STATES.GOOD:ratio>.5?GAUGE_STATES.OK:ratio>=.2?GAUGE_STATES.WARN:GAUGE_STATES.DANGER
  return{done:safeDone,total:safeTotal,ratio,percent:Math.round(ratio*100),state}
}
