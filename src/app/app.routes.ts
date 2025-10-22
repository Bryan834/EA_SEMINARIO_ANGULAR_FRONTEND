import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { UsuarisComponent } from './components/usuaris/usuaris.component';
import { EventoComponent } from './components/evento/evento.component';
import { HomeComponent } from './components/home/home.component';
import { authGuard } from './guards/auth.guard';
import { LoginComponent } from './components/login/login.component';

export const routes: Routes = [
  // 🔹 Página principal redirige a login
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 🔹 Login (pública)
  { path: 'login', component: LoginComponent },

  // 🔹 Registro (pública)
  {
    path: 'registro',
    loadComponent: () =>
      import('./components/registro/registro.component').then(
        (m) => m.RegistroComponent
      ),
  },

  // 🔹 Rutas protegidas (solo con sesión iniciada)
  {
    path: 'home',
    component: HomeComponent,
    canActivate: [authGuard],
  },
  {
    path: 'usuaris',
    component: UsuarisComponent,
    canActivate: [authGuard],
  },
  {
    path: 'evento',
    component: EventoComponent,
    canActivate: [authGuard],
  },

  // 🔹 Cualquier otra ruta redirige a login
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
