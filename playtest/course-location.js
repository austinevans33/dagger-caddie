// Attach real course coordinates to an exact selected OpenGolfAPI course.
// Never use phone GPS or a similarly named course as a substitute.
import {normalizeCourse} from './course-identity.js';
import {normalizeCourseCoordinates} from './open-meteo-weather.js';
const BASE='https://api.opengolfapi.org/v1/courses/';
export function normalizeOpenGolfLocation(course,record){
 const selected=normalizeCourse(course);
 if(!selected||selected.provider!=='opengolfapi'||!record||typeof record!=='object')return null;
 // Provider records can arrive as a direct course, a {course} detail, or a
 // GeoJSON feature. Every accepted shape must carry the exact selected ID.
 const detail=record.course&&typeof record.course==='object'?record.course:record;
 if(String(detail.id??'')!==selected.providerCourseId)return null;
 if(record!==detail&&record.id!=null&&String(record.id)!==selected.providerCourseId)return null;
 const candidates=[
  {latitude:detail.latitude,longitude:detail.longitude},
  {latitude:detail.location?.latitude,longitude:detail.location?.longitude},
  {latitude:detail.properties?.latitude,longitude:detail.properties?.longitude}
 ];
 // GeoJSON uses [longitude, latitude], unlike most web map coordinate pairs.
 const geo=detail.geometry?.type==='Point'?detail.geometry.coordinates:null;
 if(Array.isArray(geo)&&geo.length===2)candidates.push({latitude:geo[1],longitude:geo[0]});
 const coordinates=candidates.map(normalizeCourseCoordinates).find(Boolean);
 if(!coordinates)return null;
 return Object.freeze({course:selected,coordinates,source:'opengolfapi-course-location'});
}
export async function loadCourseLocation(course,{fetcher=fetch,signal}={}){
 const selected=normalizeCourse(course);
 if(!selected||selected.provider!=='opengolfapi')return null;
 const response=await fetcher(BASE+encodeURIComponent(selected.providerCourseId),{headers:{Accept:'application/json'},signal});
 if(!response.ok)throw Error('Course location unavailable ('+response.status+').');
 return normalizeOpenGolfLocation(selected,await response.json());
}
