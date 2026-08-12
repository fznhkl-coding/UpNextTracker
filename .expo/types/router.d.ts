/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/login`; params?: Router.UnknownInputParams; } | { pathname: `/modal`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}/dashboard` | `/dashboard`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}/profile` | `/profile`; params?: Router.UnknownInputParams; };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/login`; params?: Router.UnknownOutputParams; } | { pathname: `/modal`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}/dashboard` | `/dashboard`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(drawer)'}/profile` | `/profile`; params?: Router.UnknownOutputParams; };
      href: Router.RelativePathString | Router.ExternalPathString | `/login${`?${string}` | `#${string}` | ''}` | `/modal${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}/dashboard${`?${string}` | `#${string}` | ''}` | `/dashboard${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(drawer)'}/profile${`?${string}` | `#${string}` | ''}` | `/profile${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/login`; params?: Router.UnknownInputParams; } | { pathname: `/modal`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}/dashboard` | `/dashboard`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(drawer)'}/profile` | `/profile`; params?: Router.UnknownInputParams; };
    }
  }
}
