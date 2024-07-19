import ConversationItem from "@/Components/App/ConversationItem";
import TextInput from "@/Components/TextInput";
import { PencilSquareIcon } from "@heroicons/react/24/solid";
import { usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
const ChatLayout = ({ children }) => {
    const page = usePage();
    const conversations = page.props.conversations;
    const selectedConversations = page.props.selectedConversations;
    const [localConversations, setLocalConversations] = useState([]);
    const [sortedConversations, setSortedConversations] = useState([]);
    const [onlineUsers, setOnlineUsers] = useState({});

    const isUserOnline = (userId) => onlineUsers[userId];

    // console.log(conversations, "conversations");
    // console.log(selectedConversations, "selectedConversations");

    const onSearch = (ev) => {
        const search = ev.target.value.toLowercase();
        setLocalConversations(
            conversations.filter((conversation) => {
                return conversation.name.toLowercase().includes(search);
            })
        );
    };
    useEffect(() => {
        setSortedConversations(
            localConversations.sort((a, b) => {
                if (a.blocked_at && b.blocked_at) {
                    return a.blocked_at > b.blocked_at ? 1 : -1;
                } else if (a.blocked_at) {
                    return 1;
                } else if (b.blocked_at) {
                    return 1;
                }
                if (a.last_message_at && b.last_message_at) {
                    return b.last_message.localCompare(a.last_message_at);
                } else if (a.last_message) {
                    return -1;
                } else if (b.last_message) {
                    return 1;
                } else {
                    return 0;
                }
            })
        );
    }, [localConversations]);

    useEffect(() => {
        setLocalConversations(conversations);
    }, [localConversations]);

    useEffect(() => {
        Echo.join("online")
            .here((users) => {
                const onlineUsersObj = Object.fromEntries(
                    users.map((user) => [user.id, user])
                );

                setOnlineUsers((prevOnlineUsers) => {
                    return { ...prevOnlineUsers, ...onlineUsersObj };
                });
            })
            .joining((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updateUsers = { ...prevOnlineUsers };
                    updateUsers[user.id] = user;
                    return updateUsers;
                });
            })
            .leaving((user) => {
                setOnlineUsers((prevOnlineUsers) => {
                    const updateUsers = { ...prevOnlineUsers };
                    delete updateUsers[user.id];
                    return updateUsers;
                });
            })
            .error((error) => {
                console.log("error", error);
            });

        return () => {
            Echo.leave("online");
        };
    }, []);

    return (
        <>
            <div className="flex-1 w-full overflow-hidden">
                <div
                    className={`w-full transition-all sm:w-[220px] md:w-[300px] bg-slate-800
                flex flex-col overflow-hidden ${
                    selectedConversations ? "-ml-[100%] sm:ml-0" : ""
                }`}
                >
                    <div className="flex items-center justify-between px-3 py-2 text-xl font-medium text-gray-200">
                        My Conversations
                        <div
                            className="tooltip tooltip-left"
                            data-tip="Create New Group"
                        >
                            <button className="text-gray-400 hover:text-gray-200">
                                <PencilSquareIcon className="inline-block w-4 h-4 ml-2" />
                            </button>
                        </div>
                    </div>
                    <div className="p-3">
                        <TextInput
                            onKeyUp={onSearch}
                            placeholder="Filter users and groups"
                            className="w-full"
                        />
                    </div>
                    <div className="overflow-auto flex1 ">
                        {sortedConversations &&
                            sortedConversations.map((conversation, index) => (
                                <ConversationItem
                                    key={`${
                                        conversation.is_group ? "group_" : "user_"
                                    }${conversation.id}_${index}`} // Appending index for uniqueness
                                    conversation={conversation}
                                    online={!!isUserOnline(conversation.id)}
                                    selectedConversations={selectedConversations}
                                />
                            ))}
                    </div>
                </div>
                <div className="flex flex-col flex-1 w-full overflow-hidden">
                    {children}
                </div>
            </div>
        </>
    );
};

export default ChatLayout;
