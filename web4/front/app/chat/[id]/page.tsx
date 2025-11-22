import ChatPage from "./ChatPage";

interface PageProps {
  params: Promise<{ id: string }>;
}

const Page = async ({ params }: PageProps) => {
  const {id} = await params;

  return <ChatPage chatId={id}></ChatPage>;
};

export default Page;