import { rootModule } from '@ditsmod/core';
import { RouterModule } from '@ditsmod/router';

import { PostsModule } from './posts/posts.module';

@rootModule({
  path: 'api',
  imports: [RouterModule],
  appends: [{ path: 'posts/:postId', module: PostsModule }],
})
export class AppModule {}
