import os
import dotenv
from flask import Flask, render_template, request, jsonify
from langchain.vectorstores import DeepLake
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.chat_models import ChatOpenAI
from langchain.chains import ConversationalRetrievalChain

dotenv.load_dotenv()
DEEPLAKE_ACCOUNT_NAME = os.getenv("DEEPLAKE_ACCOUNT_NAME")
chat_history = []
qa, retriever, model, embeddings, db = None, None, None, None, None
app = Flask(__name__)


@app.before_first_request
def initialize():
    global embeddings, db, retriever, model, qa
    embeddings = OpenAIEmbeddings()
    db = DeepLake(
        dataset_path=f"hub://{DEEPLAKE_ACCOUNT_NAME}/langchain-code-short",
        read_only=True,
        embedding_function=embeddings,
    )
    retriever = db.as_retriever()
    retriever.search_kwargs["distance_metric"] = "cos"
    retriever.search_kwargs["fetch_k"] = 20
    retriever.search_kwargs["maximal_marginal_relevance"] = True
    retriever.search_kwargs["k"] = 15
    model = ChatOpenAI(model="gpt-3.5-turbo")  # 'ada' 'gpt-3.5-turbo' 'gpt-4',
    qa = ConversationalRetrievalChain.from_llm(model, retriever=retriever)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/ask", methods=["POST"])
def ask():
    data = request.get_json()
    question = data["question"]
    answer = find_answer(question)
    return jsonify(answer=answer)


def find_answer(question):
    # try:
        result = qa({"question": question, "chat_history": chat_history})
        chat_history.append((question, result["answer"]))
    # except:
    #     result = {
    #         "answer": "I am sorry, I am not able to figure answere with given context."
    #     }
        return result["answer"]


if __name__ == "__main__":
    app.run()
