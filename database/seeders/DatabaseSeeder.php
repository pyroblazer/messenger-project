<?php

namespace Database\Seeders;

use App\Models\Conversation;
use App\Models\Group;
use App\Models\Message;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin users
        User::factory()->create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true
        ]);

        User::factory()->create([
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'password' => bcrypt('password'),
            'is_admin' => true
        ]);

        // Create regular users
        User::factory(10)->create();

        // Seed groups, messages, and conversations
        for ($i = 0; $i < 5; $i++) {
            // Create a group with an owner
            $group = Group::factory()->create(['owner_id' => 1]);

            // Get random users and attach them to the group
            $users = User::inRandomOrder()->limit(rand(2, 5))->pluck('id');
            
            $group->users()->attach(array_unique([1, ...$users]));
          

            // Create messages
            Message::factory(1000)->create();

            // Get messages without group_id (assuming group_id is nullable)
            $messages = Message::whereNull('group_id')->orderBy('created_at')->get();

            // Group messages into conversations
            $conversations = $messages->groupBy(function ($message) {
                return collect([$message->sender_id, $message->receiver_id])->sort()->implode('_');
            })->map(function ($groupMessages) {
                return [
                    'user_id1' => $groupMessages->first()->sender_id,
                    'user_id2' => $groupMessages->first()->receiver_id,
                    'last_message_id' => $groupMessages->last()->id,
                    'created_at' => new Carbon(),
                    'updated_at' => new Carbon(),
                ];
            })->values();

            // Insert conversations (ignore duplicates)
            Conversation::insertOrIgnore($conversations->toArray());
        }
    }
}
