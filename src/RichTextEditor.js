import React from "react";
import {
    Editor,
    EditorState,
    RichUtils,
    getDefaultKeyBinding,
    Modifier,
    ContentState
} from "draft-js";
import "./RichEditor.css";

class RichEditorExample extends React.Component {
    constructor(props) {
        super(props);
        this.state = { editorState: EditorState.createEmpty() };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => this.setState({ editorState });

        this.handleKeyCommand = this._handleKeyCommand.bind(this);
        this.handleBeforeInput = this._handleBeforeInput.bind(this);
        this.mapKeyToEditorCommand = this._mapKeyToEditorCommand.bind(this);
        this.toggleBlockType = this._toggleBlockType.bind(this);
        this.toggleInlineStyle = this._toggleInlineStyle.bind(this);
    }

    componentDidMount() {
        const savedText = sessionStorage.getItem("Text");
        if (savedText) {
            const contentState = ContentState.createFromText(savedText);
            const editorState = EditorState.createWithContent(contentState);
            this.setState({ editorState });
        }
    }

    _handleKeyCommand(command, editorState) {
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }

    _handleBeforeInput(chars) {
        const { editorState } = this.state;
        const selection = editorState.getSelection();
        const startKey = selection.getStartKey();
        const currentContent = editorState.getCurrentContent();
        const currentBlock = currentContent.getBlockForKey(startKey);
        const blockText = currentBlock.getText();

        if (selection.isCollapsed() && chars === " ") {
            if (blockText.startsWith("#")) {
                this._applyBlockStyle("header-one", blockText);
                return "handled";
            }

            if (blockText.startsWith("***")) {
                this._applyUnderline(blockText);
                return "handled";
            }

            if (blockText.startsWith("**")) {
                this._applyRed(blockText);
                return "handled";
            }

            if (blockText.startsWith("*")) {
                this._applyBold(blockText);
                return "handled";
            }
        }

        return "not-handled";
    }

    _applyBlockStyle(blockType, blockText) {
        const { editorState } = this.state;
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();
        const newBlockText = blockText.replace(/^#+\s*/, "");

        const updatedContentState = Modifier.setBlockType(
            Modifier.replaceText(
                contentState,
                selectionState.merge({
                    anchorOffset: 0,
                    focusOffset: blockText.length,
                }),
                newBlockText
            ),
            selectionState,
            blockType
        );

        this.onChange(EditorState.push(editorState, updatedContentState, "change-block-type"));
    }

    _applyUnderline(blockText) {
        const { editorState } = this.state;
        const updatedText = blockText.replace("***", "");
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();

        const updatedContent = Modifier.replaceText(
            contentState,
            selectionState.merge({
                anchorOffset: 0,
                focusOffset: blockText.length,
            }),
            updatedText
        );

        const newState = EditorState.push(editorState, updatedContent, "change-inline-style");
        const underlinedState = RichUtils.toggleInlineStyle(newState, "UNDERLINE");

        this.onChange(underlinedState);
    }

    _applyBold(blockText) {
        const { editorState } = this.state;
        const updatedText = blockText.replace("*", "");
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();

        const updatedContent = Modifier.replaceText(
            contentState,
            selectionState.merge({
                anchorOffset: 0,
                focusOffset: blockText.length,
            }),
            updatedText
        );

        const newState = EditorState.push(editorState, updatedContent, "change-inline-style");
        const boldState = RichUtils.toggleInlineStyle(newState, "BOLD");

        this.onChange(boldState);
    }

    _applyRed(blockText) {
        const { editorState } = this.state;
        const updatedText = blockText.replace("**", "");
        const contentState = editorState.getCurrentContent();
        const selectionState = editorState.getSelection();

        const updatedContent = Modifier.replaceText(
            contentState,
            selectionState.merge({
                anchorOffset: 0,
                focusOffset: blockText.length,
            }),
            updatedText
        );

        const newState = EditorState.push(editorState, updatedContent, "change-inline-style");
        const redState = RichUtils.toggleInlineStyle(newState, "RED");

        this.onChange(redState);
    }

    _mapKeyToEditorCommand(e) {
        if (e.keyCode === 9 /* TAB */) {
            const newEditorState = RichUtils.onTab(e, this.state.editorState, 4 /* maxDepth */);
            if (newEditorState !== this.state.editorState) {
                this.onChange(newEditorState);
            }
            return;
        }
        return getDefaultKeyBinding(e);
    }

    saveText = () => {
        const content = this.state.editorState.getCurrentContent();
        const plainText = content.getPlainText();
        sessionStorage.setItem("Text", plainText);
    };

    _toggleBlockType(blockType) {
        this.onChange(RichUtils.toggleBlockType(this.state.editorState, blockType));
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(RichUtils.toggleInlineStyle(this.state.editorState, inlineStyle));
    }

    render() {
        const { editorState } = this.state;

        let className = "RichEditor-editor";
        const contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== "unstyled") {
                className += " RichEditor-hidePlaceholder";
            }
        }

        return (
            <div className="RichEditor-root" >
                <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "20px" }}>
                    <h1> Demo editor by OM Kamble </h1>
                    <button onClick={this.saveText} style={{ position: "fixed", left: "600px", height: "30px", width: "80px" }}>Save</button>
                </div>
                <div className={className} style={{ height: "60vh", border: "1px solid #666", padding: "10px" }} onClick={this.focus}>
                    <Editor
                        blockStyleFn={getBlockStyle}
                        customStyleMap={styleMap}
                        editorState={editorState}
                        handleKeyCommand={this.handleKeyCommand}
                        handleBeforeInput={this.handleBeforeInput}
                        keyBindingFn={this.mapKeyToEditorCommand}
                        onChange={this.onChange}
                        placeholder=""
                        ref="editor"
                        spellCheck={true}
                    />
                </div>
            </div>
        );
    }
}

const styleMap = {
    CODE: {
        backgroundColor: "rgba(0, 0, 0, 0.05)",
        fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
        fontSize: 16,
        padding: 2,
    },
    RED: {
        color: "red",
    },
    UNDERLINE: {
        textDecoration: "underline",
    },
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case "blockquote": return "RichEditor-blockquote";
        default: return null;
    }
}

export default RichEditorExample;
