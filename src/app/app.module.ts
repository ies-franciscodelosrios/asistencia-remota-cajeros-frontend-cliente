import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button'
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from "@angular/material/form-field"
import { MatInputModule } from "@angular/material/input"
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClientModule } from "@angular/common/http";
import { CallService } from './services/call.service';
import { ClipboardModule } from '@angular/cdk/clipboard';

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    HttpClientModule,
    ClipboardModule,
    MatSnackBarModule
  ],
  providers: [
    CallService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
