// Attach real course coordinates to an exact selected OpenGolfAPI course.
// Never use phone GPS or a similarly named course as a substitute.
import {normalizeCourse} from './course-identity.js';
import {normalizeCourseCoordinates} from './open-meteo-weather.js';
const BASE='https://api.opengolfapi.org/v1/courses/';
export function normalizeOpenGolfLocation(course,record){
 const selected=normalizeCourse(course);
 if(!selected||selected.provider!=='opengolfapi'||!record||String(record.id)!==selected.providerCourseId)return null;
 const latitude=record.latitude,longitude=record.longitude;
 const coordinates=normalizeCourseCoordinates({latitude,longitude});
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
