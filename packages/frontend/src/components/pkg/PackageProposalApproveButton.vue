<script>
import gql from 'graphql-tag'
import { pkgProposalFragment, pkgFragment } from './fragments'
import { useMutation, useQuery, useResult } from '@vue/apollo-composable'

export default {
  props: {
    projectTypeId: {
      type: String,
      required: true,
    },

    proposal: {
      type: Object,
      required: true,
    },
  },

  setup (props, { root }) {
    // Proposals
    const { result } = useQuery(gql`
      query ProjectTypePackages ($id: ID!) {
        projectType (id: $id) {
          id
          packageProposals {
            id
          }
        }
      }
    `, () => ({
      id: props.projectTypeId,
    }), {
      fetchPolicy: 'cache-and-network',
    })
    const proposals = useResult(result, [], data => data.projectType.packageProposals)

    // Action
    const { mutate } = useMutation(gql`
      mutation ApprovePackageProposal ($input: ApprovePackageProposalInput!) {
        approvePackageProposal (input: $input) {
          ...pkg
        }
      }
      ${pkgFragment}
    `, () => {
      // Save current proposal ID as it will change since we immediately select another proposal
      const currentProposalId = props.proposal.id
      return {
        variables: {
          input: {
            proposalId: currentProposalId,
          },
        },
        update: (cache, { data: { approvePackageProposal } }) => {
          const query = {
            query: gql`
              query ProjectTypePackages ($id: ID!) {
                projectType (id: $id) {
                  id
                  packageProposals {
                    ...pkgProposal
                  }
                }
              }
              ${pkgProposalFragment}
            `,
            variables: {
              id: props.projectTypeId,
            },
          }
          const data = cache.readQuery(query)
          const list = data.projectType.packageProposals
          const index = list.findIndex(p => p.id === currentProposalId)
          if (index !== -1) {
            list.splice(index, 1)
            cache.writeQuery({
              ...query,
              data,
            })
          }
        },
        optimisticResponse: {
          __typename: 'Mutation',
          approvePackageProposal: {
            __typename: 'Package',
            ...props.proposal,
          },
        },
      }
    })

    async function approve () {
      // Select next proposal
      if (proposals.value.length === 1) {
        root.$router.push({ name: 'project-type-proposals' })
      } else {
        let index = proposals.value.findIndex(p => p.id === props.proposal.id)
        if (index === proposals.value.length - 1) {
          index = 0
        } else {
          index++
        }
        const nextProposal = proposals.value[index]
        if (nextProposal) {
          root.$router.push({
            name: 'package-proposal',
            params: { packageId: nextProposal.id },
          })
        }
      }

      // Approve mutation
      await mutate()
    }

    return {
      approve,
    }
  },
}
</script>

<template>
  <BaseButton
    :disabled="!proposal.repo"
    class="bg-red-800 hover:bg-red-700"
    @click="approve()"
  >
    Approve
  </BaseButton>
</template>
