import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CONTACT_NAME_MAX, CONTACT_NOTES_MAX, CONTACT_ORGANIZATION_MAX, CONTACT_TITLE_MAX, NOTE_BODY_MAX, NOTE_TITLE_MAX, NOTEBOOK_NAME_MAX, PROJECT_NAME_MAX, REMIND_BEFORE_VALUES, REPEAT_INTERVAL_MAX, SETTINGS_KEYS, TAGS_PER_ITEM, TASK_DESCRIPTION_MAX, TASK_NOTES_MAX, TASK_SERIES_ID_MAX, TASK_TITLE_MAX, TRIP_LOCATION_MAX, TRIP_NAME_MAX, TRIP_NOTES_MAX, TRIP_PURPOSE_MAX } from '@/lib/limits'

const rules=readFileSync(resolve(process.cwd(),'firestore.rules'),'utf8')

const expected={
  validTask:{title:TASK_TITLE_MAX,description:TASK_DESCRIPTION_MAX,notes:TASK_NOTES_MAX,tags:TAGS_PER_ITEM,seriesId:TASK_SERIES_ID_MAX},
  validProject:{name:PROJECT_NAME_MAX},
  validNotebook:{name:NOTEBOOK_NAME_MAX},
  validNote:{title:NOTE_TITLE_MAX,body:NOTE_BODY_MAX,tags:TAGS_PER_ITEM},
  validContact:{fullName:CONTACT_NAME_MAX,organization:CONTACT_ORGANIZATION_MAX,title:CONTACT_TITLE_MAX,notes:CONTACT_NOTES_MAX},
  validTrip:{name:TRIP_NAME_MAX,location:TRIP_LOCATION_MAX,purpose:TRIP_PURPOSE_MAX,notes:TRIP_NOTES_MAX},
}

describe('đồng bộ giới hạn Firestore',()=>{
  it('khớp giới hạn lặp và các mốc nhắc',()=>{expect(rules).toContain(`repeat.interval <= ${REPEAT_INTERVAL_MAX}`);expect(rules).toContain(`remindBefore in [${REMIND_BEFORE_VALUES.join(',')}]`)})
  it('khớp các key settings profile',()=>{expect(rules).toContain(`settings.keys().hasOnly([${SETTINGS_KEYS.map(key=>`'${key}'`).join(',')}])`)})
  it('khớp mọi ràng buộc size tối đa với limits.js',()=>{
    const actual={};let functionName=''
    for(const line of rules.split('\n')){
      const declaration=line.match(/function\s+(valid\w+)\(/u)
      if(declaration)functionName=declaration[1]
      for(const [,field,limit] of line.matchAll(/request\.resource\.data\.(\w+)\.size\(\)\s*<=\s*(\d+)/gu)){
        actual[functionName]??={};actual[functionName][field]=Number(limit)
      }
    }
    expect(actual).toEqual(expected)
  })
})
