import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { assignColor, buildCatalog, colorFallback, normalizeTag, normalizeTags, tagKey, TAG_HUES } from '@/tags/tagUtils'

const hslToRgb=(h,s,l)=>{s/=100;l/=100;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h/60%2-1)),m=l-c/2;let rgb=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return rgb.map(value=>value+m)}
const luminance=rgb=>rgb.map(value=>value<=.03928?value/12.92:((value+.055)/1.055)**2.4).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0)
const contrast=(a,b)=>{const values=[luminance(a),luminance(b)].sort((x,y)=>y-x);return(values[0]+.05)/(values[1]+.05)}

describe('nhãn nhiệm vụ',()=>{
 it('chuẩn hóa, giới hạn, khử trùng và xử lý Unicode NFC',()=>{
  expect(normalizeTag('  ##Họp   tuần  ')).toBe('Họp tuần')
  expect(tagKey('Họp')).toBe(tagKey('họp'))
  expect(normalizeTags([' #Họp ','họp','A','B','C','D','E','x'.repeat(25)])).toEqual(['Họp','A','B','C','D'])
 })
 it('xếp catalog theo số lần rồi lần dùng cuối',()=>{
  const tasks=[{tags:['Họp','Gấp'],updatedAt:'2026-01-01'},{tags:['họp'],updatedAt:'2026-01-03'},{tags:['Gấp'],updatedAt:'2026-01-02'}]
  expect(buildCatalog(tasks,{c:{họp:4,gấp:2}}).map(item=>[item.key,item.count,item.lastUsed,item.color])).toEqual([['họp',2,'2026-01-03',4],['gấp',2,'2026-01-02',2]])
 })
 it('phân 12 màu khác nhau và fallback ổn định',()=>{
  const registry={c:{}},colors=[];for(let index=0;index<12;index++){const key=`tag-${index}`,color=assignColor(key,registry);registry.c[key]=color;colors.push(color)}
  expect(new Set(colors).size).toBe(12);expect(colorFallback('Họp')).toBe(colorFallback('Họp'));expect(colorFallback('Họp')).toBeGreaterThanOrEqual(0);expect(colorFallback('Họp')).toBeLessThan(12)
 })
 it('mọi cặp màu đạt tương phản WCAG 4.5:1',()=>{
  const css=readFileSync('src/styles/tags.css','utf8');expect(TAG_HUES).toHaveLength(12)
  for(const hue of TAG_HUES){for(const value of [`hsl(${hue} 85% 92%)`,`hsl(${hue} 65% 26%)`,`hsl(${hue} 60% 80%)`,`hsl(${hue} 35% 24%)`,`hsl(${hue} 85% 86%)`,`hsl(${hue} 35% 38%)`])expect(css).toContain(value);expect(contrast(hslToRgb(hue,65,26),hslToRgb(hue,85,92))).toBeGreaterThanOrEqual(4.5);expect(contrast(hslToRgb(hue,85,86),hslToRgb(hue,35,24))).toBeGreaterThanOrEqual(4.5)}
 })
})
