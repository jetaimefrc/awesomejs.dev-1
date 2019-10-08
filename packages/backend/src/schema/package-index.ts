import { Context } from '@/context'

export async function getIndexObject (
  ctx: Context,
  pkg: any,
  projectType: any,
) {
  const npmData = await ctx.npm(`/${encodeURIComponent(pkg.data.name)}`)
  let githubData
  if (pkg.data.metadata.github) {
    const { owner, repo } = pkg.data.metadata.github.data.slug
    const { data } = await ctx.github.repos.get({
      owner,
      repo,
    })
    githubData = data
  } else {
    githubData = {}
  }
  return {
    objectID: pkg.ref.id,
    _tags: [...(pkg.data.info.tags || []), ...(npmData.keywords || [])],
    name: pkg.data.name,
    description: githubData.description || npmData.description,
    keywords: npmData.keywords,
    license: npmData.license,
    projectType: {
      id: projectType.ref.id,
      name: projectType.data.name,
      slug: projectType.data.slug,
      logo: projectType.data.logo,
    },
  }
}

export async function indexPackage (
  ctx: Context,
  pkg: any,
  projectType: any,
) {
  const index = ctx.algolia.initIndex('packages')
  return index.addObject(await getIndexObject(ctx, pkg, projectType))
}
