const pairs = [
  ['ink / paper', '#0B0B0C', '#FFFFFF'],
  ['ink / lime', '#0B0B0C', '#A6EA6B'],
  ['ink / lavender', '#0B0B0C', '#A9A8F6'],
  ['muted / paper', '#525750', '#FFFFFF'],
  ['muted / surface', '#525750', '#F5F7F0'],
  ['dark text / sheet', '#F4F7EF', '#141816'],
  ['dark muted / sheet', '#B8C2B4', '#141816'],
  ['danger / danger background', '#7A1F10', '#FFD8CF'],
  ['warning / warning background', '#614500', '#FFE49B'],
  ['done / done background', '#14532D', '#C9EFD7'],
  ['doing / doing background', '#173F80', '#D5E3FF'],
  ['todo / todo background', '#343833', '#E8E9E5'],
]

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255)
    .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2]
}

let failed = false
for (const [name, foreground, background] of pairs) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  const ratio = (values[0] + .05) / (values[1] + .05)
  console.log(`${ratio >= 4.5 ? '✓' : '✗'} ${name}: ${ratio.toFixed(2)}:1`)
  if (ratio < 4.5) failed = true
}

if (failed) process.exitCode = 1
