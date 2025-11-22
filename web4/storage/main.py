from flask import Flask, send_file, jsonify, abort, request, send_from_directory
import os
from werkzeug.utils import secure_filename
import time
import mimetypes
from io import BytesIO
app = Flask(__name__)


@app.route("/")
def index():
    return "storage: internal file storage"

@app.route("/chat/<chat_id>", methods=["POST"])
def chat(chat_id):
    if not chat_id.isdigit():
        abort(404)
    os.makedirs(f"chats/{chat_id}", exist_ok=True)
    os.makedirs(f"chats/{chat_id}/attachments", exist_ok=True)
    filename=''
    if request.files:
        try:
            file = request.files['file']
            filename=file.filename
            file_path = os.path.join(f"chats/{chat_id}/attachments", file.filename)
            file.save(file_path)
        except Exception as e:
            return jsonify({"status": "error", "message": str(e)}), 501
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    try:
        with open(f"chats/{chat_id}/history.log", "a") as f:
            f.write(f"[{timestamp}] {request.form.get('author', '')}: {request.form.get('text','')}\t{filename}\n")
            return jsonify({"status": "ok"})
    except Exception as e:
        abort(500)


@app.route("/chat/<chat_id>/attachment/<filename>", methods=["GET"])
def attachment(chat_id, filename):
    if not chat_id.isdigit():
        abort(404)
    
    safe_name = secure_filename(filename)
    if not safe_name or safe_name != filename:
        abort(400)
    
    file_path = os.path.join("chats", str(chat_id), "attachments", safe_name)
    
    if not os.path.exists(file_path):
        abort(404)

    mime_type, _ = mimetypes.guess_type(file_path)
    if not mime_type:
        mime_type = "application/octet-stream"
    buf = BytesIO()
    with open(file_path, "rb") as f:
        buf.write(f.read())
        buf.seek(0)

        return send_file(
            buf,
            mimetype=mime_type,
            as_attachment=False,
            download_name=safe_name
        )

@app.route("/chat/<chat_id>/history")
def history(chat_id):
    if not chat_id.isdigit():
        abort(404)
    try:
        with open(f"chats/{str(chat_id)}/history.log", "r") as f:
            return jsonify({"history": f.readlines()})
    except FileNotFoundError:
        abort(404)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False)
