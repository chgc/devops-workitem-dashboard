import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  bufferCount,
  concatMap,
  forkJoin,
  from,
  map,
  mergeMap,
  toArray,
} from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'workitems-board';
  pat = '<your pat>';
  private organization = '<your org>';
  private project = '<your project>';
  private devopsUrl = `https://dev.azure.com/${this.organization}/${this.project}`;
  data = {};

  constructor(private http: HttpClient) {
    this.getWorkItem('680c943c-325f-4d48-a11a-617b3dd67d3c');
  }

  getWorkItem(queryId: string) {
    const headers = new HttpHeaders({
      Authorization: `Basic ${btoa(`PAT:${this.pat}`)}`,
      'api-version': '6.0',
    });

    const url = `${this.devopsUrl}/_apis/wit/wiql/${queryId}`;
    this.http
      .get(url, { headers })
      .pipe(
        map((x: any) => ({
          workItemIds: x.workItems.map((m: any) => m.id) as string[],
          fields: x.columns.map((m: any) => m.referenceName) as string[],
        })),
        mergeMap(({ workItemIds, fields }) =>
          from(workItemIds).pipe(
            bufferCount(200),
            mergeMap((ids) =>
              this.http.post(
                `${this.devopsUrl}/_apis/wit/workitemsbatch?api-version=6.0`,
                {
                  ids,
                  fields,
                },
                { headers }
              )
            ),
            toArray()
          )
        ),
        map((x) => x.flatMap((m: any) => m.value)),
        map((items) =>
          items.map((x) => ({
            id: x.id,
            title: x.fields['System.Title'],
            state: x.fields['System.State'],
            workItemType: x.fields['System.WorkItemType'],
          }))
        )
      )
      .subscribe({
        next: (value) => (this.data = value),
      });
  }

  getquery() {
    const url =
      'https://dev.azure.com/akdi2019/tadepeo/_apis/wit/queries?api-version=6.0&$depth=1';
    this.http
      .get(url, {
        headers: new HttpHeaders({
          Authorization: `Basic ${btoa(`PAT:${this.pat}`)}`,
        }),
      })
      .subscribe({
        next: (value) => (this.data = value),
      });
  }
}
