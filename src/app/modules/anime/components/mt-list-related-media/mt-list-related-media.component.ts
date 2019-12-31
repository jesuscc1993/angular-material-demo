import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { PageEvent } from '@angular/material';
import { of } from 'rxjs';
import { catchError, flatMap, takeUntil, tap } from 'rxjs/operators';

import {
  WithObservableOnDestroy,
} from '../../../shared/components/with-observable-on-destroy/with-observable-on-destroy.component';
import { AuthStore } from '../../../shared/store/auth.store';
import { MediaStore } from '../../../shared/store/media.store';
import { Anime, MediaFormat, mediaFormats } from '../../../shared/types/anilist/media.types';
import { basicMediaSorts, MediaSort } from '../../../shared/types/anilist/mediaSort.types';
import { PageInfo } from '../../../shared/types/anilist/pageInfo.types';
import { AnimeService } from '../../services/anime.service';

const gridCard = 96;
const gridSpacing = 6;

@Component({
  selector: 'mt-list-related-media',
  templateUrl: './mt-list-related-media.component.html',
  styleUrls: ['./mt-list-related-media.component.scss'],
})
export class MtListRelatedMediaComponent extends WithObservableOnDestroy implements OnInit {
  @ViewChild('content', { read: ElementRef }) content: ElementRef;
  readonly mediaSorts = basicMediaSorts;
  readonly mediaFormats = mediaFormats;
  readonly rowCount = 4;

  colCount?: number;

  relatedMediaIds: number[];
  animeList: Anime[];
  pagination: PageInfo;
  selectedSort: MediaSort = 'END_DATE_DESC';
  selectedFormats: MediaFormat[] = [];

  searching: boolean;
  error: Error;

  constructor(private mediaStore: MediaStore, private animeService: AnimeService, private authStore: AuthStore) {
    super();
    this.initialize();
    this.onError = this.onError.bind(this);
  }

  ngOnInit() {
    this.onResize();

    this.mediaStore
      .changes('animeListEntries')
      .pipe(
        takeUntil(this.destroyed$),
        tap(() => this.initialize()),
        flatMap(() => this.queryData()),
        catchError(this.onError)
      )
      .subscribe();
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    const newColCount = Math.floor(this.content.nativeElement.offsetWidth / (gridCard + gridSpacing));

    if (newColCount !== this.colCount) {
      this.colCount = Math.floor(this.content.nativeElement.offsetWidth / (gridCard + gridSpacing));

      this.initialize();
      this.queryData()
        .pipe(takeUntil(this.destroyed$), catchError(this.onError))
        .subscribe();
    }
  }

  queryData() {
    return this.animeService.getRelatedAnimeMediaIds(this.authStore.getUser()).pipe(
      tap(relatedMediaIds => {
        this.relatedMediaIds = relatedMediaIds;
        this.search(0, this.colCount * this.rowCount);
      })
    );
  }

  sortBy(mediaSort: MediaSort) {
    this.selectedSort = mediaSort;
    this.search(0, this.pagination.perPage);
  }

  selectedFormatChanged(selectedFormats: MediaFormat[]) {
    this.selectedFormats = selectedFormats;
    this.search(0, this.pagination.perPage);
  }

  changePage({ pageIndex, pageSize }: PageEvent) {
    this.search(pageIndex + 1, pageSize);
  }

  private initialize() {
    this.searching = true;
    this.relatedMediaIds = undefined;
    this.pagination = undefined;
    this.error = undefined;
  }

  private search(pageIndex?: number, perPage?: number) {
    this.searching = true;
    this.error = undefined;

    this.animeService
      .getAnimeFromIds(
        this.relatedMediaIds,
        {
          formatIn: this.selectedFormats.length ? this.selectedFormats : undefined,
          sort: this.selectedSort,
        },
        {
          pageIndex,
          perPage,
        }
      )
      .pipe(
        tap(response => {
          this.animeList = response.media;
          this.pagination = response.pageInfo;
          this.pagination.pageIndex = response.pageInfo.currentPage - 1;
          this.searching = false;
        }),
        catchError(this.onError)
      )
      .subscribe();
  }

  private onError(error: Error) {
    this.error = error;
    this.searching = false;

    return of();
  }
}
