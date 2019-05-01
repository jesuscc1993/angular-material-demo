import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { flatMap, map, tap } from 'rxjs/operators';

import { MediaStore } from '../../shared/store/media.store';
import { ListEntry } from '../../shared/types/anilist/listEntry.types';
import { Anime } from '../../shared/types/anilist/media.types';
import { PageQuery } from '../../shared/types/anilist/pageInfo.types';
import { User } from '../../shared/types/anilist/user.types';
import { SearchFilters } from '../api/anime/anime-api.types';
import { AnimeApi } from '../api/anime/anime.api';

@Injectable()
export class AnimeService {
  constructor(private animeApi: AnimeApi, private mediaStore: MediaStore) {}

  public getAnimeGenres() {
    return this.animeApi.queryAnimeGenres();
  }

  public searchAnime(query: SearchFilters, pageInfo?: PageQuery) {
    return this.animeApi.queryAnimeSearch(query, pageInfo).pipe(
      flatMap(pageData => {
        const animeIds = pageData.media.map(media => media.id);
        return this.getAnimeFromIds(animeIds).pipe(
          map(animeList => ({ ...pageData, media: animeIds.map(id => animeList.find(anime => anime.id === id)) }))
        );
      }),
      tap(pageData => this.mediaStore.storeAnime(pageData.media))
    );
  }

  public getAnimeListEntries(user: User) {
    const storeEntries = this.mediaStore.getAnimeListEntries();
    return storeEntries
      ? of(storeEntries)
      : this.animeApi.queryAnimeList(user).pipe(tap(listEntries => this.mediaStore.setAnimeListEntries(listEntries)));
  }

  public getRelatedAnimeMediaIds(user: User) {
    const storeEntries = this.mediaStore.getAnimeListEntries();
    return this.animeApi.queryRelatedAnimeMediaIds(user).pipe(
      flatMap(animeMediaIds =>
        (storeEntries ? of(storeEntries) : this.animeApi.queryAnimeList(user)).pipe(
          map(entries => {
            const userMediaIds = entries.map(entry => entry.media.id);
            return animeMediaIds.filter(mediaId => !userMediaIds.includes(mediaId));
          })
        )
      )
    );
  }

  public getAnimeListFavouriteIDs(user: User, callback: (favouriteIDs: number[]) => void) {
    return this.animeApi.queryAnimeListFavouriteIDs(user, callback);
  }

  public saveAnimeListEntry(listEntry: ListEntry) {
    return this.animeApi.saveAnimeListEntry(listEntry).pipe(
      map(updatedListEntry => ({ ...listEntry, ...updatedListEntry })),
      tap(updatedListEntry => {
        this.mediaStore.updateAnimeListEntry(updatedListEntry);
      })
    );
  }

  public deleteAnimeListEntry(listEntry: ListEntry) {
    return this.animeApi.deleteAnimeListEntry(listEntry).pipe(
      tap(() => {
        this.mediaStore.deleteAnimeListEntry(listEntry.id);
      })
    );
  }

  public toggleFavouriteAnimeListEntry(listEntry: ListEntry) {
    return this.animeApi.toggleAnimeFavouriteEntry(listEntry);
  }

  private getAnimeFromIds(mediaIds: number[]): Observable<Anime[]> {
    const animeDictionary = this.mediaStore.getAnimeDictionary();
    const storeIds = Object.keys(animeDictionary).map(key => parseInt(key));
    const missingIds = mediaIds.filter(id => storeIds.indexOf(id) < 0);

    return missingIds.length ? this.animeApi.queryAnimeFromIds(mediaIds) : of(mediaIds.map(id => animeDictionary[id]));
  }
}
