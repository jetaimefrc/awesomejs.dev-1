import gql from 'graphql-tag'
import { query as q, values } from 'faunadb'
import { Resolvers } from '@/generated/schema'
import { DBProjectType } from './db-types'

export const typeDefs = gql`
type ProjectType {
  id: ID!
  name: String!
  slug: String!
  logo: String!
  popularTags: [Tag!]!
  tags: [Tag!]!
}

type Tag {
  id: ID!
  count: Int!
}

extend type Query {
  projectTypes: [ProjectType!]!
  projectType (id: ID!): ProjectType
  projectTypeBySlug (slug: String!): ProjectType
}
`

function getSortedTags (projectType: DBProjectType) {
  return Object.keys(projectType.tagMap).filter(
    (key) => key !== projectType.name.toLowerCase(),
  ).map((key) => ({
    id: key,
    count: projectType.tagMap[key],
  })).sort(
    (a, b) => b.count - a.count,
  )
}

export const resolvers: Resolvers = {
  ProjectType: {
    popularTags: (projectType) => {
      return getSortedTags(projectType).slice(0, 8)
    },
    tags: (projectType) => {
      return getSortedTags(projectType)
    },
  },

  Query: {
    projectTypes: async (root, args, ctx) => {
      const { data } = await ctx.db.query(
        q.Map(
          q.Paginate(
            q.Match(q.Index('projecttypes_sort_by_name_asc')),
          ),
          q.Lambda(['name', 'ref'], q.Get(q.Var('ref'))),
        ),
      )
      return data.map((doc: values.Document) => ({
        id: doc.ref.id,
        ...doc.data,
      }))
    },

    projectType: async (root, { id }, ctx) => {
      const { data } = await ctx.db.query(
        q.Get(q.Ref(q.Collection('ProjectTypes'), id)),
      )
      if (data) {
        return {
          id,
          ...data,
        }
      }
    },

    projectTypeBySlug: async (root, { slug }, ctx) => {
      const { ref: { id }, data } = await ctx.db.query(
        q.Get(q.Match(q.Index('projecttypes_by_slug'), slug)),
      )
      if (data) {
        return {
          id,
          ...data,
        }
      }
    },
  },
}
