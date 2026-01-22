import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import * as $ from 'jquery';


bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));


  //Para interceptar errores de red y mostrar un mensaje de error al usuario, se puede utilizar un interceptor de errores de red.
//Para ello, se puede crear un archivo llamado http-error.interceptor.ts en la carpeta src/app/servicios con el siguiente contenido:


  /*import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { httpErrorInterceptor } from './app/servicios/http-error.interceptor';
import * as $ from 'jquery';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([httpErrorInterceptor])),
    ...appConfig.providers
  ]
})
  .catch((err) => console.error(err));*/

