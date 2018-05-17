import { Injectable, EventEmitter, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable ,  Observer ,  Subscription } from 'rxjs';
import * as CryptoJS from 'crypto-js';

import { HttpStatusCode } from './http-status-code';

const api_url_base: string = "/api";
const MCVI_PASSWD_PREFIX_PUBLIC="MCVI-PRE-PUBLIC";

export enum user_operation_error{
  unknown_error, network_error, not_logged_in, auth_fail, not_exist, already_exist
}

export function uuid4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export class User {
  token: string;
  id: number;
  email: string;
  is_super: boolean;
  priv_level: string;

  private constructor() { }

  static fromResponseObject(token: string, o: object): User{
    let u = new User();

    u.token = token;
    u.id = o["id"];
    u.email = o["email"];
    u.is_super = o["is_super"];
    u.priv_level = "Personal";

    return u;
  }
}

export class ApplyInfo {
  school: string;
  team_name: string;
  team_leader: string;
  team_member1: string;
  team_member2: string;
  phone: string;
  qq: string;
  passed: boolean;

  private constructor() { }

  static info_keys: string[] = ["school", "team_name", "team_leader", "team_member1", "team_member2", "phone", "qq"];
  static fromResponseObject(o: object): ApplyInfo{
    let info = new ApplyInfo();

    for(let k of this.info_keys){
      info[k] = o[k];
    }
    return info;
  }
  static fromObject(o: object): ApplyInfo{
    let info = new ApplyInfo();

    for(let k of this.info_keys){
      info[k] = o[k];
    }
    return info;
  }
  public toFormData(): FormData{
    let data = new FormData();

    for(let k of ApplyInfo.info_keys){
      data.append(k, this[k]);
    }
    return data;
  }
}

export class AsyncMulticastObservable<T> extends Observable<T> {
  private notify: Function;

  private next_observable: Observable<T>;
  private sub_next: Subscription;
  private observers: Observer<T>[] = [];

  public constructor(subscribe) {
    super((observer) => {
      this.observers.push(observer);
      if(this.observers.length===1){
        this.notify = (o: Observer<T>) => { };
        this.sub_next=this.next_observable.subscribe(
          next => {
            this.update_next(next);
          },
          error => {
            this.update_error(error);
          },
          () => {
            this.update_complete();
          },
        );
      }else{
        this.notify(observer);
      }

      let this_observable = this;
      return {unsubscribe() {
        this_observable.observers.splice(this_observable.observers.indexOf(observer),1);
        if(this_observable.observers.length===0){
          this_observable.sub_next.unsubscribe();
        }
      }};
    });
    this.next_observable = new Observable<T>(subscribe);
  }
  public update_next(value: T) {
    this.update((o: Observer<T>) => { o.next(value); });
  }
  public update_error(err: any) {
    this.update((o: Observer<T>) => { o.error(err); });
  }
  public update_complete() {
    this.update((o: Observer<T>) => { o.complete(); });
  }
  public update(notify: Function) {
    this.notify = notify;
    for(let o of this.observers){
      notify(o);
    }
  }
}

@Injectable()
export class SharedService {
  public user_token: AsyncMulticastObservable<string|user_operation_error>;
  public user_info: AsyncMulticastObservable<User|user_operation_error>;
  public user_apply_info: AsyncMulticastObservable<ApplyInfo|user_operation_error>;

  constructor(private _http: HttpClient) {
    this.user_token = new AsyncMulticastObservable((observer) => {
      let token = localStorage.getItem("user_token");
      if(token===null){
        observer.next(user_operation_error.not_logged_in);
      }else{
        observer.next(token);
      }
      return {unsubscribe() { }};
    });
    this.user_info = new AsyncMulticastObservable((observer) => {
      let s = this.user_token.subscribe(
        next => {
          if(typeof next === "string"){
            let token = next;
            this.http_get_user_info(token).subscribe(
              next => {
                observer.next(next);
              },
              error => {
                observer.next(error);
              }
            );
          }else{
            let err = next;
            switch(err){
              case user_operation_error.not_logged_in:
              observer.next(err);
              break;
              default:
              observer.next(user_operation_error.unknown_error);
            }
          }
        },
      );
      return {unsubscribe() {
        s.unsubscribe();
      }};
    });
    this.user_apply_info = new AsyncMulticastObservable((observer) => {
      let s = this.user_info.subscribe(
        next => {
          if(next instanceof User){
            let user = next;
            this.http_get_user_apply_info(user).subscribe(
              next => {
                observer.next(next);
              },
              error => {
                observer.next(error);
              }
            );
          }else{
            let error = next;
            switch(error){
              case user_operation_error.not_logged_in:
              case user_operation_error.auth_fail:
              case user_operation_error.network_error:
              observer.next(error);
              break;
              default:
              observer.next(user_operation_error.unknown_error);
            }
          }
        },
      );
      return {unsubscribe() {
        s.unsubscribe();
      }};
    });
  }

  protected auth_header(token: string, priv_level: string) {
    return {
      "X-MCVI-Auth-Token": token,
      "X-MCVI-Auth-Privilege": priv_level,
    };
  }

  protected http_get_user_info(token: string): Observable<User>{
    let echo_request = this._http.post(api_url_base+"/auth/echo", null, {
      headers: this.auth_header(token, "Personal"),
      responseType: "json",
    });

    return new Observable((observer) => {
      let s = echo_request.subscribe(
        response => {
          if(response["authenticated_identity"]=="Personal"){
            let user_info = User.fromResponseObject(token, response["object"]);
            observer.next(user_info);
          }else{
            observer.error(user_operation_error.auth_fail);
          }
        },
        error => {
          observer.error(user_operation_error.network_error);
        },
      );

      return {unsubscribe() {
        s.unsubscribe();
      }};
    });
  }

  protected password_hash(prefix: string, password:string, suffix: string): string{
    let t = [prefix, MCVI_PASSWD_PREFIX_PUBLIC, password, suffix].join('-');
    let h = CryptoJS.SHA512(t).toString();
    return h;
  }

  public user_login(email: string,  password: string): Observable<any>{
    let data = new FormData();
    data.append("email", email);
    let get_public_salt_request = this._http.post(api_url_base+"/auth/public_salt", data, {
      responseType: "json",
    });

    return new Observable((observer) => {
      var s_salt: Subscription|undefined = undefined;
      var s_login: Subscription|undefined = undefined;

      s_salt = get_public_salt_request.subscribe(
        response => {
          let prefix = response["public_salt"]["prefix"];
          let suffix = response["public_salt"]["suffix"];
          let h = this.password_hash(prefix, password, suffix);

          let data = new FormData();
          data.append("email", email);
          data.append("password_hash", h);
          s_login = this._http.post(api_url_base+"/auth/login", data, {
            responseType: "json",
          }).subscribe(
            response => {
              let token = response["token"];
              localStorage.setItem("user_token", token);
              this.user_token.update_next(token);
              observer.complete();
            },
            error => {
              if(error instanceof ErrorEvent){
                observer.error(user_operation_error.network_error);
              }else{
                if(error.status===HttpStatusCode.Unauthorized){
                  observer.error(user_operation_error.auth_fail);
                }else{
                  observer.error(user_operation_error.network_error);
                }
              }
            },
          );
        },
        error => {
          if(error instanceof ErrorEvent){
            observer.error(user_operation_error.network_error);
          }else{
            if(error.status===HttpStatusCode.NotFound){
              observer.error(user_operation_error.not_exist);
            }else{
              observer.error(user_operation_error.network_error);
            }
          }
        },
      );
      return {unsubscribe() {
        for(let s of [s_login, s_salt]){
          if(s!==undefined)s.unsubscribe();
        }
      }};
    });
  }

  public user_logout(): void{
    localStorage.removeItem("user_token");
    this.user_token.update_next(user_operation_error.not_logged_in);
  }

  public switch_priv_level(priv_level: string): void{
    let re_entry: boolean = false;
    let s = this.user_info.subscribe(
      next => {
        if(re_entry)return;

        if(next instanceof User){
          let user = next;

          if(priv_level==="Super"&&user.is_super)user.priv_level="Super";
          else user.priv_level="Personal";

          re_entry = true;
          this.user_info.update_next(user);
        }else{
          //current usages guarantee the success
        }
      },
    )
  }

  public user_register(email:string, password: string): Observable<any>{
    let data = new FormData();
    data.append("email", email);

    const prefix = uuid4();
    const suffix = uuid4();
    const h = this.password_hash(prefix, password, suffix);

    data.append("public_salt_prefix", prefix);
    data.append("public_salt_suffix", suffix);
    data.append("client_hash", h);

    let register_request = this._http.put(api_url_base+"/user/", data, {
      responseType: "json",
    });

    return new Observable((observer) => {
      let s = register_request.subscribe(
        response => {
          observer.complete();
        },
        error => {
          if(error instanceof ErrorEvent){
            observer.error(user_operation_error.network_error);
          }else{
            if(error.status==HttpStatusCode.Conflict){
              observer.error(user_operation_error.already_exist);
            }else{
              observer.error(user_operation_error.network_error);
            }
          }
        },
      );

      return {unsubscribe() {
        s.unsubscribe();
      }};
    });
  }

  protected user_apply_info_url(user: User): string{
    return api_url_base+"/user/"+user.id+"/apply_info";
  }

  protected http_get_user_apply_info(user: User): Observable<ApplyInfo>{
    let request = this._http.get(this.user_apply_info_url(user), {
      responseType: "json",
      headers: this.auth_header(user.token, user.priv_level),
    });

    return new Observable((observer) => {
      let s = request.subscribe(
        response => {
          let info = ApplyInfo.fromResponseObject(response["object"]);
          observer.next(info);
        },
        error => {
          if(error instanceof ErrorEvent){
            observer.error(user_operation_error.network_error);
          }else{
            if(error.status==HttpStatusCode.NotFound){
              observer.error(user_operation_error.not_exist);
            }else{
              observer.error(user_operation_error.network_error);
            }
          }
        },
      );
      return {unsubscribe() {
        s.unsubscribe();
      }};
    });
  }

  public http_update_user_apply_info(o: object): Observable<any>{
    let info = ApplyInfo.fromObject(o);
    console.log(info);
    let data = info.toFormData();
    return new Observable((observer) => {
      let s_update: Subscription|undefined = undefined;
      let s_user = this.user_info.subscribe(
        next => {
          if(next instanceof User){
            let user = next;

            s_update = this._http.post(this.user_apply_info_url(user), data, {
              responseType: "json",
              headers: this.auth_header(user.token, user.priv_level),
            }).subscribe(
              response => {
                this.user_apply_info.update_next(info);
                observer.complete();
              },
              error => {
                observer.error(user_operation_error.network_error);
              },
            );
          }else{
            observer.error(user_operation_error.unknown_error);
          }
        },
      );
      return {unsubscribe() {
        for(let s of [s_update, s_user]){
          if(s!==undefined)s.unsubscribe();
        }
      }};
    });
  }
  public http_get_apply_info_list(page: number): Observable<any>{
    return new Observable((observer) => {
      let s_req: Subscription|undefined = undefined;
      let s_user = this.user_info.subscribe(
        next => {
          let headers;
          let is_admin: boolean;

          if((next instanceof User)||(next===user_operation_error.not_logged_in)){
            if(next instanceof User){
              let user = next;
              headers = this.auth_header(user.token, user.priv_level);
              is_admin = (user.priv_level==="Super");
            }else{
              headers = {};
              is_admin = false;
            }

            s_req = this._http.get(api_url_base+"/apply_list/page/"+page, {
              responseType: "json",
              headers: headers,
            }).subscribe(
              response => {
                let page_num: number = response["page_num"];
                let info_list: ApplyInfo[] = [];
                for(let item of response["list"]){
                  let info = ApplyInfo.fromResponseObject(item);
                  info_list.push(info);
                }
                let data = {
                  is_admin: is_admin,
                  total_page_num: page_num,
                  list: info_list,
                };
                observer.next(data);
              },
              error => {
                observer.next(user_operation_error.network_error);
              },
            );
          }else{
            observer.next(next);
          }
        },
      );
      return {unsubscribe() {
        for(let s of [s_req, s_user]){
          if(s!=undefined)s.unsubscribe();
        }
      }};
    });
  }

}
