import { Component, OnInit } from '@angular/core';
import { User } from "../../models/anilist/user";
import { AnimeService } from "../../providers/anime.service";

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {

  user: User;
  statusObjects: any;
  statuses: any;

  multiListEnabled: boolean;

  constructor(
    private animeService: AnimeService
  ) {
    this.user = this.animeService.getUser();

    if (this.user) {
      this.animeService.getList(this.user).subscribe((response) => {
        this.statusObjects = response;
        this.statuses = Object.keys(response).sort();
      });
    }
  }

  ngOnInit(): void {

  }

  hasDataOfStatus(status: string): boolean {
    return this.statusObjects &&
           this.statusObjects[status] &&
           this.statusObjects[status].length > 0;
  }

  getListAsString(): string {
    return JSON.stringify(this.statusObjects, undefined, 2);
  }

}