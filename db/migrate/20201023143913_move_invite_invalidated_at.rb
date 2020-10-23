# frozen_string_literal: true

class MoveInviteInvalidatedAt < ActiveRecord::Migration[6.0]
  def change
    execute "UPDATE invites SET deleted_at = LEAST(deleted_at, invalidated_at)"
  end
end
