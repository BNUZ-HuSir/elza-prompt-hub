"""Elza Prompt Hub 前端弹窗使用的本地 API。"""

from __future__ import annotations

try:
    from .prompt_core import (
        PromptDataConflict,
        PromptDataError,
        delete_document,
        export_document,
        export_documents_archive,
        reveal_data_folder,
        import_document,
        list_documents,
        load_document,
        save_document,
    )
    from .prompt_syntax import (
        DynamicPromptSyntaxError,
        analyze_probabilities,
    )
    from .prompt_nodes import render_mix_prompt
except ImportError:
    from prompt_core import (
        PromptDataConflict,
        PromptDataError,
        delete_document,
        export_document,
        export_documents_archive,
        reveal_data_folder,
        import_document,
        list_documents,
        load_document,
        save_document,
    )
    from prompt_syntax import DynamicPromptSyntaxError, analyze_probabilities
    from prompt_nodes import render_mix_prompt


def _error_payload(code: str, message: str):
    return {"success": False, "error": {"code": code, "message": message}}


try:
    from aiohttp import web
    from server import PromptServer

    @PromptServer.instance.routes.get("/elza/prompt-hub/documents/{kind}")
    async def elza_list_documents(request):
        try:
            return web.json_response({
                "success": True,
                "documents": list_documents(request.match_info["kind"]),
            })
        except PromptDataError as error:
            return web.json_response(_error_payload("INVALID_KIND", str(error)), status=400)
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "无法读取用户数据目录"), status=500
            )

    @PromptServer.instance.routes.get(
        "/elza/prompt-hub/documents/{kind}/{document_id}"
    )
    async def elza_load_document(request):
        try:
            document, revision = load_document(
                request.match_info["kind"], request.match_info["document_id"]
            )
            return web.json_response({
                "success": True,
                "document": document,
                "revision": revision,
            })
        except PromptDataError as error:
            return web.json_response(_error_payload("INVALID_DOCUMENT", str(error)), status=404)
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "无法读取数据文件"), status=500
            )

    @PromptServer.instance.routes.post("/elza/prompt-hub/documents/{kind}")
    async def elza_save_document(request):
        try:
            body = await request.json()
            document, revision = save_document(
                request.match_info["kind"],
                body.get("document"),
                body.get("expected_revision"),
            )
            return web.json_response({
                "success": True,
                "document": document,
                "revision": revision,
            })
        except PromptDataConflict as error:
            return web.json_response(_error_payload("SAVE_CONFLICT", str(error)), status=409)
        except (PromptDataError, ValueError) as error:
            return web.json_response(_error_payload("INVALID_DOCUMENT", str(error)), status=400)
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "保存失败，原文件未被替换"), status=500
            )

    @PromptServer.instance.routes.delete(
        "/elza/prompt-hub/documents/{kind}/{document_id}"
    )
    async def elza_delete_document(request):
        try:
            delete_document(
                request.match_info["kind"], request.match_info["document_id"]
            )
            return web.json_response({"success": True})
        except PromptDataError as error:
            return web.json_response(
                _error_payload("INVALID_DOCUMENT", str(error)), status=404
            )
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "删除数据文件失败"), status=500
            )

    @PromptServer.instance.routes.post("/elza/prompt-hub/import/{kind}")
    async def elza_import_document(request):
        try:
            body = await request.json()
            document, revision = import_document(
                request.match_info["kind"],
                str(body.get("content", "")),
                str(body.get("filename", "")),
            )
            return web.json_response({
                "success": True,
                "document": document,
                "revision": revision,
            })
        except PromptDataError as error:
            return web.json_response(
                _error_payload("INVALID_IMPORT", str(error)), status=400
            )
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "导入数据文件失败"), status=500
            )

    @PromptServer.instance.routes.get(
        "/elza/prompt-hub/export/{kind}/{document_id}"
    )
    async def elza_export_document(request):
        try:
            content, filename = export_document(
                request.match_info["kind"], request.match_info["document_id"]
            )
            return web.Response(
                body=content,
                content_type="application/yaml",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        except PromptDataError as error:
            return web.json_response(
                _error_payload("INVALID_DOCUMENT", str(error)), status=404
            )
        except OSError:
            return web.json_response(
                _error_payload("STORAGE_ERROR", "导出数据文件失败"), status=500
            )

    @PromptServer.instance.routes.post(
        "/elza/prompt-hub/documents/{kind}/{document_id}/open-folder"
    )
    async def elza_open_document_folder(request):
        try:
            folder = reveal_data_folder(
                request.match_info["kind"], request.match_info["document_id"]
            )
            return web.json_response({"success": True, "folder": str(folder)})
        except PromptDataError as error:
            return web.json_response(
                _error_payload("INVALID_DOCUMENT", str(error)), status=404
            )
        except OSError as error:
            return web.json_response(
                _error_payload("OPEN_FOLDER_ERROR", f"无法打开文件夹：{error}"), status=500
            )

    @PromptServer.instance.routes.get("/elza/prompt-hub/export/{kind}")
    async def elza_export_documents_archive(request):
        try:
            content, filename = export_documents_archive(request.match_info["kind"])
            return web.Response(
                body=content,
                content_type="application/zip",
                headers={"Content-Disposition": f'attachment; filename="{filename}"'},
            )
        except PromptDataError as error:
            return web.json_response(
                _error_payload("INVALID_KIND", str(error)), status=400
            )
        except OSError:
            return web.json_response(
                _error_payload("BACKUP_ERROR", "生成备份文件失败"), status=500
            )

    @PromptServer.instance.routes.post("/elza/prompt-hub/syntax/probabilities")
    async def elza_syntax_probabilities(request):
        try:
            body = await request.json()
            analysis = analyze_probabilities(str(body.get("text", "")))
            return web.json_response({"success": True, "analysis": analysis})
        except DynamicPromptSyntaxError as error:
            return web.json_response(
                _error_payload("SYNTAX_ERROR", str(error)), status=400
            )

    @PromptServer.instance.routes.post("/elza/prompt-hub/mix/preview")
    async def elza_mix_preview(request):
        try:
            body = await request.json()
            text = render_mix_prompt(
                body.get("sections", []),
                body.get("final_weight", 1.0),
            )
            return web.json_response({"success": True, "text": text})
        except (TypeError, ValueError) as error:
            return web.json_response(
                _error_payload("PREVIEW_ERROR", str(error)), status=400
            )

except ImportError:
    pass
